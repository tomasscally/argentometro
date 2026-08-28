/**
 * Verifica el catálogo contra el dump oficial de metadatos.
 *
 * La documentación de la API indica que los identificadores de serie salen de
 * la columna `serie_id` de este archivo:
 *   https://apis.datos.gob.ar/series/api/dump/series-tiempo-metadatos.csv
 *
 * Es también la única forma de saber si una serie sigue publicándose. Una serie
 * puede desaparecer o marcarse discontinuada sin que la API devuelva error:
 * simplemente deja de actualizarse. Consultarlo a mano no escala, así que esto
 * se corre solo:
 *
 *   npm run verificar-series
 *
 * Devuelve código distinto de cero si algo no cierra, para que el job diario
 * avise antes de que se rompa la aplicación.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INDICATORS } from '../src/data/indicators'
import { parseCsvTable } from '../src/lib/csvTable'
import type { Frequency } from '../src/types'

const DUMP_URL = 'https://apis.datos.gob.ar/series/api/dump/series-tiempo-metadatos.csv'

/**
 * Cuánto puede atrasarse una serie antes de que valga la pena avisar.
 *
 * No es la frecuencia: es la frecuencia más el rezago habitual de publicación.
 * Una encuesta anual sale con más de un año de atraso sin que pase nada —CEDLAS
 * publica en tandas que cubren hasta el año anterior—, y ponerle el umbral en
 * un año llenaría la salida de avisos que no significan nada.
 */
const STALE_DAYS: Record<Frequency, number> = {
  diaria: 25,
  mensual: 75,
  trimestral: 210,
  semestral: 400,
  anual: 1100,
  irregular: 2200,
}

interface Meta {
  id: string
  discontinuada: boolean
  desde: string
  hasta: string
  unidades: string
  frecuencia: string
  descripcion: string
}

async function loadDump(): Promise<Map<string, Meta>> {
  process.stdout.write('Descargando el dump de metadatos… ')
  const response = await fetch(DUMP_URL)
  if (!response.ok) throw new Error(`HTTP ${response.status} al pedir el dump`)
  const text = await response.text()
  console.log(`${(text.length / 1024 / 1024).toFixed(1)} MB`)

  const rows = parseCsvTable(text)
  const header = rows[0]
  const col = (name: string) => header.indexOf(name)
  const iId = col('serie_id')
  const iDisc = col('serie_discontinuada')
  const iDesde = col('serie_indice_inicio')
  const iHasta = col('serie_indice_final')
  const iUnid = col('serie_unidades')
  const iFrec = col('indice_tiempo_frecuencia')
  const iDesc = col('serie_descripcion')
  if (iId === -1) throw new Error('el dump no tiene la columna serie_id')

  const meta = new Map<string, Meta>()
  for (const row of rows.slice(1)) {
    if (!row[iId]) continue
    meta.set(row[iId], {
      id: row[iId],
      discontinuada: row[iDisc] === 'True',
      desde: row[iDesde] ?? '',
      hasta: row[iHasta] ?? '',
      unidades: row[iUnid] ?? '',
      frecuencia: row[iFrec] ?? '',
      descripcion: row[iDesc] ?? '',
    })
  }
  return meta
}

function daysSince(date: string): number {
  const t = Date.parse(date)
  if (Number.isNaN(t)) return Infinity
  return Math.floor((Date.now() - t) / 86400000)
}

interface Snapshot {
  points: { date: string; value: number }[]
  fetchedAt: string
}

function readSnapshot(id: string): Snapshot | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), 'public', 'data', `${id}.json`), 'utf8')
    ) as Snapshot
  } catch {
    return null
  }
}

async function main() {
  const meta = await loadDump()
  console.log(`${meta.size.toLocaleString('es-AR')} series en el catálogo oficial\n`)

  const problemas: string[] = []
  const avisos: string[] = []
  let revisadas = 0

  /*
   * Existencia y discontinuación salen del dump: es para lo que la
   * documentación de la API lo señala, y es la única forma de enterarse de que
   * una serie dejó de publicarse sin que la API devuelva error.
   */
  for (const indicator of INDICATORS) {
    for (const ref of indicator.series) {
      if (ref.sourceId !== 'datos-gob-ar') continue
      revisadas++

      const found = meta.get(ref.seriesId)
      if (!found) {
        problemas.push(
          `${indicator.id}: la serie ${ref.seriesId} ya no está en el catálogo oficial`
        )
      } else if (found.discontinuada) {
        problemas.push(
          `${indicator.id}: la serie ${ref.seriesId} figura como discontinuada`
        )
      }
    }
  }

  /*
   * La actualidad se mide contra la copia local, no contra el dump: se verificó
   * que las fechas de cobertura del dump pueden ir por detrás de lo que la API
   * efectivamente devuelve —en la serie de pobreza el dump informa 2025-07 y la
   * API entrega hasta 2026-01—, así que usarlo para esto daría falsas alarmas.
   */
  for (const indicator of INDICATORS) {
    // Un tramo histórico cerrado no se actualiza por diseño.
    const abierto = indicator.series.some((r) => r.validTo === null)
    if (!abierto && indicator.series.length > 0) continue

    const snapshot = readSnapshot(indicator.id)
    if (!snapshot || snapshot.points.length === 0) {
      problemas.push(`${indicator.id}: no hay copia local, o está vacía`)
      continue
    }

    const ultimo = snapshot.points[snapshot.points.length - 1].date
    const atraso = daysSince(ultimo)
    const limite = STALE_DAYS[indicator.frequency]
    if (atraso > limite) {
      avisos.push(
        `${indicator.id}: sin dato nuevo desde ${ultimo} (${atraso} días; ` +
          `para frecuencia ${indicator.frequency} se esperaría hasta ${limite})`
      )
    }

    /*
     * Una tasa que viene como fracción sin escalar es el error que ya se coló
     * una vez: la serie se declara en porcentaje y todos los valores quedan
     * abajo de 1,5.
     */
    const esPorcentaje = /%|porcentaje/i.test(indicator.unit)
    if (esPorcentaje && indicator.kind === 'tasa-estado') {
      const maximo = Math.max(...snapshot.points.map((p) => Math.abs(p.value)))
      if (maximo < 1.5) {
        problemas.push(
          `${indicator.id}: se declara en «${indicator.unit}» pero ningún valor supera ` +
            `${maximo.toFixed(3)}; parece una fracción sin escalar`
        )
      }
    }
  }

  console.log(`${revisadas} series de apis.datos.gob.ar revisadas contra el dump`)
  console.log(`${INDICATORS.length} indicadores revisados contra su copia local`)

  if (avisos.length) {
    console.log(`\n${avisos.length} aviso(s) — la serie existe pero viene atrasada:`)
    for (const a of avisos) console.log(`  · ${a}`)
  }

  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):`)
    for (const p of problemas) console.error(`  ✗ ${p}`)
    process.exit(1)
  }

  console.log('\n✓ El catálogo cierra contra el dump oficial y contra las copias locales.')
}

void main()
