import { describe, expect, it } from 'vitest'
import { getIndicator } from '../../data/indicators'
import { buildCsv } from '../exportData'

describe('exportación a CSV (RF-7.3, RF-3.27)', () => {
  const series = [
    {
      indicator: getIndicator('inflation'),
      points: [
        { date: '2024-01-01', value: 20.6 },
        { date: '2024-02-01', value: 13.2 },
      ],
      fetchedAt: '2026-08-27T12:00:00.000Z',
    },
  ]

  const csv = buildCsv(series, '2026-08-27T12:00:00.000Z')

  it('incluye la fuente y los identificadores de serie', () => {
    expect(csv).toContain('Ministerio de Economía')
    expect(csv).toContain('148.3_INIVELNAL_DICI_M_26')
  })

  it('incluye las notas de quiebre: el archivo no pierde la advertencia', () => {
    expect(csv).toContain('dic-2016')
    expect(csv).toContain('IPC nacional')
  })

  it('declara cuándo se tomó la copia', () => {
    expect(csv).toContain('copia tomada: 2026-08-27')
  })

  it('tiene una fila por fecha y los valores en su columna', () => {
    const lines = csv.split('\n').filter((l) => !l.startsWith('#'))
    expect(lines[0]).toBe('fecha,Inflación (IPC)')
    expect(lines[1]).toBe('2024-01-01,20.6')
    expect(lines[2]).toBe('2024-02-01,13.2')
  })

  it('alinea por fecha cuando hay varias series', () => {
    const two = buildCsv(
      [
        ...series,
        {
          indicator: getIndicator('unemployment'),
          points: [{ date: '2024-01-01', value: 7.7 }],
          fetchedAt: null,
        },
      ],
      '2026-08-27T12:00:00.000Z'
    )
    const rows = two.split('\n').filter((l) => !l.startsWith('#'))
    expect(rows[1]).toBe('2024-01-01,20.6,7.7')
    // La serie que no tiene dato en esa fecha deja la celda vacía, no un cero.
    expect(rows[2]).toBe('2024-02-01,13.2,')
  })
})
