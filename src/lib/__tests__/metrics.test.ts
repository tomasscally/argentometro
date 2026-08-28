import { describe, expect, it } from 'vitest'
import type { DataPoint, Government } from '../../types'
import {
  accumulatedRate,
  annualizedRate,
  endToEndChange,
  metricsForGovernment,
  monthSpan,
  percentagePointChange,
  pointsForGovernment,
  straddlesTransition,
} from '../metrics'

const p = (date: string, value: number): DataPoint => ({ date, value })

describe('inflación acumulada', () => {
  it('compone las variaciones en lugar de promediarlas', () => {
    // 12 meses al 5 %: 1.05^12 − 1 = 79,586 %. El promedio aritmético daría 5 %.
    const twelveMonths = Array(12).fill(5)
    expect(accumulatedRate(twelveMonths)).toBeCloseTo(79.5856, 3)
  })

  it('maneja variaciones negativas', () => {
    // +10 % y −10 % no se cancelan: 1.1 × 0.9 = 0.99 → −1 %.
    expect(accumulatedRate([10, -10])).toBeCloseTo(-1, 10)
  })

  it('devuelve NaN sin observaciones', () => {
    expect(accumulatedRate([])).toBeNaN()
  })
})

describe('anualización', () => {
  it('deja igual una acumulada de 12 meses', () => {
    expect(annualizedRate(100, 12)).toBeCloseTo(100, 10)
  })

  it('anualiza un tramo de 6 meses elevando al cuadrado', () => {
    // 1.5^2 − 1 = 125 %
    expect(annualizedRate(50, 6)).toBeCloseTo(125, 10)
  })

  it('reduce una acumulada de 24 meses a su equivalente anual', () => {
    // 4^(1/2) − 1 = 100 %
    expect(annualizedRate(300, 24)).toBeCloseTo(100, 10)
  })

  it('devuelve NaN con meses no positivos', () => {
    expect(annualizedRate(10, 0)).toBeNaN()
  })
})

describe('variación punta a punta y puntos porcentuales', () => {
  it('calcula la variación relativa', () => {
    expect(endToEndChange([p('2020-01-01', 100), p('2021-01-01', 150)])).toBeCloseTo(50)
  })

  it('distingue puntos porcentuales de variación relativa', () => {
    const points = [p('2020-01-01', 5), p('2021-01-01', 10)]
    expect(percentagePointChange(points)).toBe(5)
    expect(endToEndChange(points)).toBeCloseTo(100)
  })

  it('devuelve NaN con menos de dos puntos', () => {
    expect(endToEndChange([p('2020-01-01', 1)])).toBeNaN()
  })
})

describe('monthSpan', () => {
  it('cuenta el mes inicial', () => {
    expect(monthSpan('2020-01-01', '2020-01-31')).toBe(1)
    expect(monthSpan('2020-01-01', '2020-12-01')).toBe(12)
    expect(monthSpan('2020-01-01', '2021-01-01')).toBe(13)
  })
})

describe('asignación de puntos a gestiones (RF-6.2)', () => {
  const saliente: Government = {
    id: 'saliente', name: 'Saliente', shortName: 'Sal', party: 'X',
    startDate: '2011-12-10', endDate: '2015-12-10', color: '#000',
  }
  const entrante: Government = {
    id: 'entrante', name: 'Entrante', shortName: 'Ent', party: 'Y',
    startDate: '2015-12-10', endDate: '2019-12-10', color: '#111',
  }
  const enCurso: Government = {
    id: 'curso', name: 'En curso', shortName: 'Cur', party: 'Z',
    startDate: '2019-12-10', endDate: null, color: '#222',
  }

  const boundary = p('2015-12-10', 42)

  it('el punto exacto del traspaso va a la gestión entrante, no a la saliente', () => {
    expect(pointsForGovernment([boundary], saliente)).toHaveLength(0)
    expect(pointsForGovernment([boundary], entrante)).toHaveLength(1)
  })

  it('ningún punto se cuenta dos veces', () => {
    const points = [
      p('2015-12-09', 1),
      boundary,
      p('2015-12-11', 3),
    ]
    const total =
      pointsForGovernment(points, saliente).length +
      pointsForGovernment(points, entrante).length
    expect(total).toBe(points.length)
  })

  it('una gestión en curso no tiene tope superior', () => {
    expect(pointsForGovernment([p('2030-01-01', 7)], enCurso)).toHaveLength(1)
  })
})

describe('métricas por tipo de indicador (§7.1)', () => {
  const gov: Government = {
    id: 'g', name: 'G', shortName: 'G', party: 'P',
    startDate: '2020-01-01', endDate: '2021-01-01', color: '#000',
  }
  const points = [
    p('2020-01-01', 5),
    p('2020-06-01', 5),
    p('2020-12-01', 5),
  ]

  it('una tasa de flujo acumula y anualiza, y no promedia', () => {
    const m = metricsForGovernment(points, gov, 'tasa-flujo')!
    expect(m.accumulated).toBeCloseTo(15.7625, 3)
    expect(m.annualized).toBeDefined()
    expect(m.average).toBeUndefined()
  })

  it('un nivel usa punta a punta y no acumula', () => {
    const m = metricsForGovernment(points, gov, 'nivel')!
    expect(m.endToEnd).toBeCloseTo(0)
    expect(m.accumulated).toBeUndefined()
  })

  it('una tasa de estado usa puntos porcentuales y promedio simple', () => {
    const m = metricsForGovernment(points, gov, 'tasa-estado')!
    expect(m.ppChange).toBe(0)
    expect(m.average).toBe(5)
    expect(m.accumulated).toBeUndefined()
    expect(m.endToEnd).toBeUndefined()
  })

  it('descarta una gestión con menos de dos observaciones (RF-6.4)', () => {
    expect(metricsForGovernment([p('2020-05-01', 1)], gov, 'nivel')).toBeNull()
  })

  it('marca cuando la ventana de la gestión contiene un quiebre (RF-6.6)', () => {
    const sinQuiebre = metricsForGovernment(points, gov, 'nivel', ['2019-01-01'])!
    const conQuiebre = metricsForGovernment(points, gov, 'nivel', ['2020-07-01'])!
    expect(sinQuiebre.crossesBreak).toBe(false)
    expect(conQuiebre.crossesBreak).toBe(true)
  })
})

describe('períodos a caballo de una transición (RF-6.3)', () => {
  const saliente: Government = {
    id: 'saliente', name: 'Saliente', shortName: 'Sal', party: 'X',
    startDate: '2011-12-10', endDate: '2015-12-10', color: '#000',
  }

  it('un semestre que empieza en julio cubre el traspaso de diciembre', () => {
    expect(straddlesTransition(p('2015-07-01', 30), saliente, 'semestral')).toBe(true)
  })

  it('un semestre que empieza en enero termina antes del traspaso', () => {
    expect(straddlesTransition(p('2015-01-01', 30), saliente, 'semestral')).toBe(false)
  })

  it('un mes de noviembre no llega a cubrirlo', () => {
    expect(straddlesTransition(p('2015-11-01', 3), saliente, 'mensual')).toBe(false)
  })

  it('una gestión en curso no tiene traspaso que cruzar', () => {
    const enCurso: Government = { ...saliente, endDate: null }
    expect(straddlesTransition(p('2015-07-01', 30), enCurso, 'semestral')).toBe(false)
  })

  it('la métrica cuenta cuántas observaciones quedan a caballo', () => {
    const points = [p('2014-07-01', 1), p('2015-01-01', 2), p('2015-07-01', 3)]
    const m = metricsForGovernment(points, saliente, 'tasa-estado', [], 'semestral')!
    expect(m.straddling).toBe(1)
  })
})

describe('métrica parcial por recorte del rango visible', () => {
  const gov: Government = {
    id: 'g', name: 'G', shortName: 'G', party: 'P',
    startDate: '2020-01-01', endDate: '2024-01-01', color: '#000',
  }
  const points = [p('2021-01-01', 1), p('2022-01-01', 2)]

  it('marca recortado cuando la ventana no cubre toda la gestión', () => {
    const m = metricsForGovernment(points, gov, 'nivel', [], 'anual', {
      start: '2021-01-01',
      end: '2022-12-31',
    })!
    expect(m.clipped).toBe(true)
  })

  it('no marca recortado cuando la ventana la contiene', () => {
    const m = metricsForGovernment(points, gov, 'nivel', [], 'anual', {
      start: '2019-01-01',
      end: '2025-01-01',
    })!
    expect(m.clipped).toBe(false)
  })
})

describe('observaciones faltantes dentro de una gestión', () => {
  const macri: Government = {
    id: 'macri', name: 'Macri', shortName: 'Macri', party: 'C',
    startDate: '2015-12-10', endDate: '2019-12-10', color: '#E8B923',
  }

  it('detecta el hueco del IPC de 2016, que cae dentro de la gestión', () => {
    // Serie mensual completa salvo 2015-12 a 2016-04, como la real.
    const points: DataPoint[] = []
    for (let y = 2016; y <= 2019; y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === 2016 && m <= 4) continue
        if (y === 2019 && m > 11) continue
        points.push(p(`${y}-${String(m).padStart(2, '0')}-01`, 2))
      }
    }
    const m = metricsForGovernment(points, macri, 'tasa-flujo', [], 'mensual')!
    expect(m.count).toBe(points.length)
    expect(m.missing).toBeGreaterThan(0)
    expect(m.expected).toBeGreaterThan(m.count)
  })

  it('no marca faltantes cuando la serie está completa', () => {
    const points: DataPoint[] = []
    for (let y = 2016; y <= 2019; y++) {
      for (let mo = 1; mo <= 12; mo++) {
        points.push(p(`${y}-${String(mo).padStart(2, '0')}-01`, 2))
      }
    }
    const m = metricsForGovernment(points, macri, 'tasa-flujo', [], 'mensual')!
    expect(m.missing).toBe(0)
  })
})
