import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { INDICATORS } from '../indicators'
import { SOURCES } from '../sources'
import { parseSnapshot } from '../../adapters/snapshot'
import { segmentsFor } from '../../lib/segments'

/**
 * Las copias locales son lo que la aplicación efectivamente muestra. Si alguna
 * falta, está vacía o no coincide con el registro, el sitio sale roto: conviene
 * que falle acá y no en producción.
 */

const DATA_DIR = join(process.cwd(), 'public', 'data')

describe('copias locales de datos', () => {
  it('existe una por cada indicador del registro', () => {
    const faltantes = INDICATORS.filter(
      (i) => !existsSync(join(DATA_DIR, `${i.id}.json`))
    ).map((i) => i.id)
    expect(faltantes, `sin copia local: ${faltantes.join(', ')}`).toEqual([])
  })

  it('cada copia declara procedencia y observaciones (RF-0.9)', () => {
    for (const indicator of INDICATORS) {
      const raw = JSON.parse(readFileSync(join(DATA_DIR, `${indicator.id}.json`), 'utf8'))
      const file = parseSnapshot(raw, indicator.id)

      expect(file.points.length, indicator.id).toBeGreaterThan(0)
      // Un indicador calculado no tiene series propias: su procedencia es la
      // operación y sus insumos, en una sola entrada.
      const esperadas = indicator.computed ? 1 : indicator.series.length
      expect(file.provenance.length, indicator.id).toBe(esperadas)
      for (const prov of file.provenance) {
        expect(prov.url, `${indicator.id}/${prov.seriesId}`).toMatch(/^https:\/\//)
        expect(prov.sha256, `${indicator.id}/${prov.seriesId}`).toMatch(/^[0-9a-f]{64}$/)
        expect(prov.rows).toBeGreaterThan(0)
      }
    }
  })

  it('solo se consultaron fuentes aprobadas (RF-0.2)', () => {
    for (const indicator of INDICATORS) {
      const raw = JSON.parse(readFileSync(join(DATA_DIR, `${indicator.id}.json`), 'utf8'))
      const file = parseSnapshot(raw, indicator.id)
      for (const sourceId of file.sourceIds) {
        expect(SOURCES[sourceId]?.state, `${indicator.id} usó ${sourceId}`).toBe('aprobada')
      }
    }
  })

  it('las observaciones están ordenadas y sin fechas repetidas', () => {
    for (const indicator of INDICATORS) {
      const raw = JSON.parse(readFileSync(join(DATA_DIR, `${indicator.id}.json`), 'utf8'))
      const file = parseSnapshot(raw, indicator.id)
      const dates = file.points.map((p) => p.date)
      expect(dates, indicator.id).toEqual([...dates].sort())
      expect(new Set(dates).size, `${indicator.id} tiene fechas repetidas`).toBe(dates.length)
    }
  })

  it('ninguna serie queda partida en una cantidad absurda de tramos', () => {
    // Un umbral de hueco mal elegido para la frecuencia se nota acá: una serie
    // de días hábiles cortada en cada fin de semana daría cientos de tramos.
    for (const indicator of INDICATORS) {
      const raw = JSON.parse(readFileSync(join(DATA_DIR, `${indicator.id}.json`), 'utf8'))
      const file = parseSnapshot(raw, indicator.id)
      const segments = segmentsFor(indicator, file.points)
      expect(segments.length, `${indicator.id} se parte en ${segments.length} tramos`).toBeLessThan(12)
    }
  })

  it('el tipo de cambio no atribuye la devaluación de 2023 a la gestión saliente', () => {
    const raw = JSON.parse(readFileSync(join(DATA_DIR, 'exchange_rate.json'), 'utf8'))
    const file = parseSnapshot(raw, 'exchange_rate')
    const hasta9 = file.points.filter((p) => p.date <= '2023-12-09')
    expect(Math.max(...hasta9.map((p) => p.value))).toBeLessThan(400)
  })
})

describe('indicadores calculados (§5.3)', () => {
  const computed = INDICATORS.filter((i) => i.computed)

  it('hay indicadores calculados y declaran sus insumos', () => {
    expect(computed.length).toBeGreaterThan(0)
    for (const indicator of computed) {
      for (const input of indicator.computed!.inputs) {
        expect(
          INDICATORS.some((i) => i.id === input),
          `${indicator.id} depende de ${input}, que no está en el registro`
        ).toBe(true)
      }
    }
  })

  it('ninguno declara series propias: se derivan de otros', () => {
    for (const indicator of computed) {
      expect(indicator.series, indicator.id).toEqual([])
    }
  })

  it('la brecha cambiaria da valores plausibles', () => {
    const raw = JSON.parse(readFileSync(join(DATA_DIR, 'usd_gap.json'), 'utf8'))
    const file = parseSnapshot(raw, 'usd_gap')
    const byDate = new Map(file.points.map((p) => [p.date, p.value]))

    // Máximo del cepo, antes de la unificación de diciembre de 2023.
    const max = Math.max(...file.points.map((p) => p.value))
    expect(max).toBeGreaterThan(150)
    expect(max).toBeLessThan(400)
    // Con el mercado unificado la brecha es chica.
    const ultimo = file.points[file.points.length - 1].value
    expect(Math.abs(ultimo)).toBeLessThan(30)
    // Diciembre de 2023, antes del traspaso: brecha alta.
    expect(byDate.get('2023-12-09')).toBeGreaterThan(100)
  })

  it('el salario real deflactado por San Luis no se multiplica de forma implausible', () => {
    // Deflactar por el IPC del período de intervención sobrestima el salario
    // real; con un deflactor continuo la serie se mantiene en otro orden.
    const raw = JSON.parse(readFileSync(join(DATA_DIR, 'real_wage_sl.json'), 'utf8'))
    const file = parseSnapshot(raw, 'real_wage_sl')
    const max = Math.max(...file.points.map((p) => p.value))
    expect(max).toBeLessThan(200)
  })
})
