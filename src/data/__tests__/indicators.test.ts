import { describe, expect, it } from 'vitest'
import { INDICATORS, getIndicator } from '../indicators'
import { GOVERNMENTS, governmentAt, rangeForGovernments } from '../governments'

describe('registro de indicadores', () => {
  it('declara escala explícita en cada serie (RF-1.5)', () => {
    for (const indicator of INDICATORS) {
      for (const ref of indicator.series) {
        expect(ref.scale, `${indicator.id}/${ref.seriesId}`).toBeGreaterThan(0)
      }
    }
  })

  it('escala a puntos porcentuales las series que la API devuelve como fracción', () => {
    // Verificado contra la API: pobreza y desempleo vienen como 0.282 y 0.078.
    for (const id of ['poverty', 'unemployment'] as const) {
      expect(getIndicator(id).series[0].scale).toBe(100)
    }
    // El tipo de cambio ya viene en pesos: no se escala.
    expect(getIndicator('exchange_rate').series[0].scale).toBe(1)
  })

  it('declara los quiebres como datos, con fecha y textos (RF-3.20)', () => {
    for (const indicator of INDICATORS) {
      for (const brk of indicator.breaks) {
        expect(brk.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(brk.short.length).toBeGreaterThan(0)
        expect(brk.long.length).toBeGreaterThan(brk.short.length)
      }
    }
  })

  it('la inflación declara el cambio de cobertura de dic-2016', () => {
    const breaks = getIndicator('inflation').breaks
    const dic2016 = breaks.find((b) => b.date === '2016-12-01')
    expect(dic2016).toBeDefined()
    expect(dic2016!.kind).toBe('cobertura')
    expect(dic2016!.short).toContain('nacional')
  })

  it('los rangos de validez de las series no se solapan', () => {
    for (const indicator of INDICATORS) {
      const sorted = [...indicator.series].sort((a, b) =>
        a.validFrom.localeCompare(b.validFrom)
      )
      for (let i = 1; i < sorted.length; i++) {
        const prevEnd = sorted[i - 1].validTo
        expect(prevEnd, `${indicator.id}: solo la última serie puede ser abierta`).not.toBeNull()
        expect(prevEnd! <= sorted[i].validFrom).toBe(true)
      }
    }
  })
})

describe('gestiones', () => {
  it('cada gestión empieza donde termina la anterior', () => {
    for (let i = 1; i < GOVERNMENTS.length; i++) {
      expect(GOVERNMENTS[i - 1].endDate).toBe(GOVERNMENTS[i].startDate)
    }
  })

  it('solo la última está en curso', () => {
    const abiertas = GOVERNMENTS.filter((g) => g.endDate === null)
    expect(abiertas).toHaveLength(1)
    expect(abiertas[0]).toBe(GOVERNMENTS[GOVERNMENTS.length - 1])
  })

  it('governmentAt asigna el traspaso a la gestión entrante', () => {
    expect(governmentAt('2015-12-10')?.id).toBe('macri')
    expect(governmentAt('2015-12-09')?.id).toBe('cfk-2')
  })

  it('usa el color de la fuerza política (RF-6.9)', () => {
    const byId = Object.fromEntries(GOVERNMENTS.map((g) => [g.id, g.color]))
    expect(byId['macri']).toBe('#E8B923')
    expect(byId['milei']).toBe('#8B45B5')
    // Las cuatro peronistas comparten familia celeste, todas distintas entre sí.
    const celestes = ['nestor-kirchner', 'cfk-1', 'cfk-2', 'alberto-fernandez'].map(
      (id) => byId[id]
    )
    expect(new Set(celestes).size).toBe(4)
  })
})

describe('rango de varias gestiones', () => {
  const hoy = '2026-08-28'

  it('dos gestiones contiguas dan el rango que las cubre', () => {
    const r = rangeForGovernments(['alberto-fernandez', 'milei'], hoy)!
    expect(r.start).toBe('2019-12-10')
    expect(r.end).toBe(hoy)
  })

  it('el orden en que se eligen no cambia el rango', () => {
    const a = rangeForGovernments(['milei', 'alberto-fernandez'], hoy)
    const b = rangeForGovernments(['alberto-fernandez', 'milei'], hoy)
    expect(a).toEqual(b)
  })

  it('dos gestiones no contiguas abarcan lo que hay en el medio', () => {
    // En un eje temporal no se puede saltear el tiempo intermedio.
    const r = rangeForGovernments(['nestor-kirchner', 'milei'], hoy)!
    expect(r.start).toBe('2003-05-25')
    expect(r.end).toBe(hoy)
  })

  it('una sola gestión da su propio período', () => {
    const r = rangeForGovernments(['macri'], hoy)!
    expect(r).toEqual({ start: '2015-12-10', end: '2019-12-10' })
  })

  it('sin gestiones no hay rango', () => {
    expect(rangeForGovernments([], hoy)).toBeNull()
    expect(rangeForGovernments(['inexistente'], hoy)).toBeNull()
  })
})
