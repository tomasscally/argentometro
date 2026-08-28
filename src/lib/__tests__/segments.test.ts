import { describe, expect, it } from 'vitest'
import type { DataPoint } from '../../types'
import { INDICATORS } from '../../data/indicators'
import { segmentsFor } from '../segments'
import {
  buildRows,
  fromTime,
  normalizeSegments,
  segmentPoints,
  toTime,
  valueAt,
  axisTicks,
} from '../segments'
import type { Segment } from '../segments'

const p = (date: string, value: number): DataPoint => ({ date, value })

const monthly = (from: number, to: number, year = 2020): DataPoint[] => {
  const out: DataPoint[] = []
  for (let m = from; m <= to; m++) out.push(p(`${year}-${String(m).padStart(2, '0')}-01`, m))
  return out
}

describe('segmentación por frecuencia (RF-3.33, RF-3.11)', () => {
  it('una serie mensual completa es un solo tramo', () => {
    expect(segmentPoints(monthly(1, 12), 'mensual')).toHaveLength(1)
  })

  it('una serie trimestral no se corta por no tener meses intermedios', () => {
    // El bug que evita: dibujada junto a una mensual, se cortaría en cada hueco.
    const quarterly = [
      p('2020-01-01', 1),
      p('2020-04-01', 2),
      p('2020-07-01', 3),
      p('2020-10-01', 4),
    ]
    expect(segmentPoints(quarterly, 'trimestral')).toHaveLength(1)
  })

  it('una serie semestral tampoco', () => {
    const semi = [p('2020-01-01', 1), p('2020-07-01', 2), p('2021-01-01', 3)]
    expect(segmentPoints(semi, 'semestral')).toHaveLength(1)
  })

  it('corta cuando falta un período que la serie debería tener', () => {
    const conHueco = [...monthly(1, 10), ...monthly(1, 3, 2021)]
    const segs = segmentPoints(conHueco, 'mensual')
    expect(segs).toHaveLength(2)
    expect(segs[0][segs[0].length - 1].date).toBe('2020-10-01')
    expect(segs[1][0].date).toBe('2021-01-01')
  })

  it('reproduce el hueco del IPC 2015-11 a 2016-04', () => {
    const puntos = [
      p('2015-09-01', 1),
      p('2015-10-01', 1),
      // sin dato entre 2015-11 y 2016-04
      p('2016-05-01', 4),
      p('2016-06-01', 3),
    ]
    const segs = segmentPoints(puntos, 'mensual')
    expect(segs).toHaveLength(2)
    expect(segs[0]).toHaveLength(2)
    expect(segs[1][0].date).toBe('2016-05-01')
  })

  it('corta también en un quiebre de metodología (RF-3.24)', () => {
    const segs = segmentPoints(monthly(1, 6), 'mensual', ['2020-04-01'])
    expect(segs).toHaveLength(2)
    expect(segs[1][0].date).toBe('2020-04-01')
  })

  it('devuelve vacío sin puntos', () => {
    expect(segmentPoints([], 'mensual')).toEqual([])
  })
})

describe('filas del gráfico', () => {
  const segments: Segment[] = [
    {
      indicatorId: 'inflation',
      key: 'inflation__0',
      color: '#f00',
      dashed: false, isLast: true, shortLabel: 'x',
      points: [p('2020-01-01', 1), p('2020-02-01', 2)],
    },
    {
      indicatorId: 'unemployment',
      key: 'unemployment__0',
      color: '#00f',
      dashed: false, isLast: true, shortLabel: 'x',
      points: [p('2020-01-01', 9)],
    },
  ]

  it('une por fecha y ordena', () => {
    const rows = buildRows(segments)
    expect(rows.map((r) => r.date)).toEqual(['2020-01-01', '2020-02-01'])
    expect(rows[0]['inflation__0']).toBe(1)
    expect(rows[0]['unemployment__0']).toBe(9)
    // La serie sin dato en esa fecha no aparece: la línea la atraviesa.
    expect(rows[1]['unemployment__0']).toBeUndefined()
  })

  it('valueAt encuentra el valor de un indicador en una fecha', () => {
    expect(valueAt(segments, 'unemployment', '2020-01-01')).toBe(9)
    expect(valueAt(segments, 'unemployment', '2020-02-01')).toBeUndefined()
  })
})

describe('normalización a base 100 (RF-3.35)', () => {
  it('usa el primer valor de cada indicador, no el de cada tramo', () => {
    const segments: Segment[] = [
      {
        indicatorId: 'inflation', key: 'inflation__0', color: '#f00', dashed: true, isLast: true, shortLabel: 'x',
        points: [p('2020-01-01', 50), p('2020-02-01', 100)],
      },
      {
        indicatorId: 'inflation', key: 'inflation__1', color: '#f00', dashed: false, isLast: true, shortLabel: 'x',
        points: [p('2021-01-01', 200)],
      },
    ]
    const out = normalizeSegments(segments)
    expect(out[0].points.map((x) => x.value)).toEqual([100, 200])
    // El segundo tramo se escala con la misma base, no con la suya.
    expect(out[1].points[0].value).toBe(400)
  })
})

describe('eje temporal (RF-3.3)', () => {
  it('convierte fecha a tiempo y vuelve sin desfase', () => {
    for (const d of ['2003-01-01', '2015-12-10', '2023-12-10', '2026-07-31']) {
      expect(fromTime(toTime(d))).toBe(d)
    }
  })

  it('ubica el traspaso aunque ninguna serie tenga ese día', () => {
    // Una serie mensual solo tiene días 01. Con eje categórico, el 10 de
    // diciembre no existiría y la banda quedaría desplazada.
    const mensual = [p('2023-11-01', 1), p('2023-12-01', 2), p('2024-01-01', 3)]
    const rows = buildRows([
      { indicatorId: 'inflation', key: 'inflation__0', color: '#f00', dashed: false, isLast: true, shortLabel: 'x', points: mensual },
    ])
    const traspaso = toTime('2023-12-10')
    expect(rows.some((r) => r.t === traspaso)).toBe(false)
    // Aun así queda entre dos puntos reales, que es lo que importa.
    expect(rows[1].t).toBeLessThan(traspaso)
    expect(rows[2].t).toBeGreaterThan(traspaso)
  })

  it('las filas quedan ordenadas por tiempo, no por texto', () => {
    const rows = buildRows([
      {
        indicatorId: 'inflation', key: 'inflation__0', color: '#f00', dashed: false, isLast: true, shortLabel: 'x',
        points: [p('2023-12-10', 2), p('2023-02-01', 1), p('2024-01-05', 3)],
      },
    ])
    expect(rows.map((r) => r.date)).toEqual(['2023-02-01', '2023-12-10', '2024-01-05'])
  })
})

describe('series diarias de días hábiles', () => {
  it('no se corta en fines de semana', () => {
    // Viernes, lunes, martes: hay tres días entre el viernes y el lunes.
    const habiles = [
      p('2024-03-01', 1), // viernes
      p('2024-03-04', 2), // lunes
      p('2024-03-05', 3),
      p('2024-03-08', 4), // viernes
      p('2024-03-11', 5), // lunes
    ]
    expect(segmentPoints(habiles, 'diaria')).toHaveLength(1)
  })

  it('sí se corta ante una interrupción real', () => {
    const conHueco = [p('2024-03-01', 1), p('2024-03-20', 2)]
    expect(segmentPoints(conHueco, 'diaria')).toHaveLength(2)
  })

  it('una serie anual tolera el salto de un año', () => {
    const anual = [p('2020-01-01', 1), p('2021-01-01', 2), p('2022-01-01', 3)]
    expect(segmentPoints(anual, 'anual')).toHaveLength(1)
  })

  it('una serie anual se corta si falta un año', () => {
    const anual = [p('2020-01-01', 1), p('2023-01-01', 2)]
    expect(segmentPoints(anual, 'anual')).toHaveLength(2)
  })
})

describe('marcas del eje temporal', () => {
  it('no repite etiquetas de año en un rango largo', () => {
    const ticks = axisTicks(toTime('2003-01-01'), toTime('2026-08-27'))
    const years = ticks.map((t) => new Date(t).getUTCFullYear())
    expect(new Set(years).size).toBe(years.length)
    expect(ticks.length).toBeLessThanOrEqual(12)
    expect(ticks.length).toBeGreaterThan(3)
  })

  it('todas las marcas caen dentro del rango', () => {
    const from = toTime('2015-06-01')
    const to = toTime('2019-12-09')
    for (const t of axisTicks(from, to)) {
      expect(t).toBeGreaterThanOrEqual(from)
      expect(t).toBeLessThanOrEqual(to)
    }
  })

  it('en un rango corto marca meses, no años', () => {
    const ticks = axisTicks(toTime('2024-01-01'), toTime('2024-12-31'))
    expect(ticks.length).toBeGreaterThan(3)
    expect(new Set(ticks).size).toBe(ticks.length)
  })
})

describe('etiquetas al final de la línea', () => {
  it('solo el último tramo la lleva', () => {
    const conQuiebre = [
      p('2020-01-01', 1),
      p('2020-02-01', 2),
      p('2020-06-01', 3),
      p('2020-07-01', 4),
    ]
    const segs = segmentPoints(conQuiebre, 'mensual')
    expect(segs.length).toBeGreaterThan(1)
  })

  it('recorta las etiquetas largas', () => {
    const largo = INDICATORS.find((i) => i.label.length > 20)
    if (!largo) return
    const segs = segmentsFor(largo, [p('2020-01-01', 1), p('2020-02-01', 2)])
    expect(segs[0].shortLabel.length).toBeLessThanOrEqual(18)
    expect(segs[0].isLast).toBe(true)
  })

  it('las etiquetas cortas quedan intactas', () => {
    const corto = INDICATORS.find((i) => i.label.length <= 18)!
    const segs = segmentsFor(corto, [p('2020-01-01', 1), p('2020-02-01', 2)])
    expect(segs[0].shortLabel).toBe(corto.label)
  })
})
