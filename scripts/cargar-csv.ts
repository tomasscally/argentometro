/**
 * Backoffice de carga de series — opción A de §8.10.1.
 *
 * Incorpora una serie desde un CSV al catálogo, como tarea administrativa. El
 * público no puede cargar series (RF-8.1): esto se corre desde el repositorio,
 * la autenticación es la del repositorio y la auditoría es el historial de git
 * (RF-8.10).
 *
 *   npm run cargar-csv -- <archivo.csv> --id <id> --label "Etiqueta" \
 *     --unit "% mensual" --frequency mensual --kind tasa-flujo \
 *     --origen "Quién produce el dato"
 *
 * Escribe `public/data/<id>.json` con la misma forma que una copia de fuente, y
 * su archivo de procedencia: quién, cuándo, desde qué archivo, con qué hash y
 * cuántas filas (RF-8.4).
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { userInfo } from 'node:os'
import { parseRows, CsvParseError } from '../src/utils/csvParser'

const OUT_DIR = join(process.cwd(), 'public', 'data')
const MAX_BYTES = 5 * 1024 * 1024

const FREQUENCIES = ['diaria', 'mensual', 'trimestral', 'semestral', 'anual']
const KINDS = ['tasa-flujo', 'nivel', 'tasa-estado']

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}

function fail(message: string): never {
  console.error(`\n  ✗ ${message}\n`)
  process.exit(1)
}

/** Convierte un CSV con encabezado a las filas que espera el parser compartido. */
function readCsvRows(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) fail('el archivo no tiene filas de datos')

  const delimiter = lines[0].includes(';') ? ';' : ','
  const header = lines[0].split(delimiter).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter)
    const row: Record<string, string> = {}
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim()
    })
    return row
  })
}

function main() {
  const file = process.argv[2]
  if (!file || file.startsWith('--')) {
    fail('falta el archivo CSV. Uso: npm run cargar-csv -- datos.csv --id mi_serie …')
  }
  if (!existsSync(file)) fail(`no existe el archivo ${file}`)

  // RF-8.9 — el tamaño se valida antes de parsear.
  const size = statSync(file).size
  if (size > MAX_BYTES) {
    fail(`el archivo pesa ${(size / 1024 / 1024).toFixed(1)} MB y el máximo es 5 MB`)
  }

  const id = arg('id')
  const label = arg('label')
  const unit = arg('unit')
  const frequency = arg('frequency')
  const kind = arg('kind')
  const origen = arg('origen')

  if (!id) fail('falta --id')
  if (!/^[a-z][a-z0-9_]*$/.test(id)) fail('el --id debe ser minúsculas, dígitos y guiones bajos')
  if (!label) fail('falta --label')
  if (!unit) fail('falta --unit')
  if (!frequency || !FREQUENCIES.includes(frequency)) {
    fail(`--frequency debe ser uno de: ${FREQUENCIES.join(', ')}`)
  }
  if (!kind || !KINDS.includes(kind)) fail(`--kind debe ser uno de: ${KINDS.join(', ')}`)
  // RF-8.5 — una serie cargada se rotula con su origen, siempre.
  if (!origen) fail('falta --origen: toda serie cargada se rotula con quién produce el dato')

  const raw = readFileSync(file, 'utf8')

  let points
  try {
    // RF-8.7 — un error de fila rechaza la carga completa.
    points = parseRows(readCsvRows(raw))
  } catch (err) {
    if (err instanceof CsvParseError) fail(`${err.message}. No se cargó nada.`)
    throw err
  }

  const now = new Date().toISOString()
  const out = {
    indicatorId: id,
    label,
    frequency,
    unit,
    kind,
    fetchedAt: now,
    sourceIds: ['carga-manual'],
    // RF-8.4 — procedencia obligatoria, con el mismo estándar que un snapshot.
    provenance: [
      {
        seriesId: id,
        sourceId: 'carga-manual',
        url: `archivo:${basename(file)}`,
        rows: points.length,
        sha256: createHash('sha256').update(raw).digest('hex'),
        cargadoPor: userInfo().username,
        cargadoEl: now,
        origen,
      },
    ],
    points,
  }

  writeFileSync(join(OUT_DIR, `${id}.json`), JSON.stringify(out), 'utf8')

  console.log(`\n  ✓ ${points.length} observaciones cargadas en ${id}`)
  console.log(`    ${points[0].date} → ${points[points.length - 1].date}`)
  console.log(`    origen: ${origen}`)
  console.log(`    archivo: public/data/${id}.json`)
  console.log(`\n  Falta declarar el indicador en src/data/indicators.ts para que`)
  console.log(`  aparezca en la interfaz, y commitear el cambio: el historial de git`)
  console.log(`  es el registro de auditoría (RF-8.10).\n`)
}

main()
