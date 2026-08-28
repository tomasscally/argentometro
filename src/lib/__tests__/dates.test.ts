import { describe, expect, it } from 'vitest'
import { endOfMonth, monthsAgo, startOfMonth, toISODate } from '../dates'

describe('fechas locales (RF-4.5)', () => {
  it('toISODate usa los componentes locales, no UTC', () => {
    // 23:30 local del 15/03. toISOString() daría el 16 en UTC-3.
    const d = new Date(2024, 2, 15, 23, 30)
    expect(toISODate(d)).toBe('2024-03-15')
  })

  it('endOfMonth devuelve el último día real del mes (RF-4.2)', () => {
    expect(endOfMonth('2024-01')).toBe('2024-01-31')
    expect(endOfMonth('2024-04')).toBe('2024-04-30')
    expect(endOfMonth('2024-02')).toBe('2024-02-29') // bisiesto
    expect(endOfMonth('2023-02')).toBe('2023-02-28')
    expect(endOfMonth('2024-12')).toBe('2024-12-31')
  })

  it('startOfMonth devuelve el primer día', () => {
    expect(startOfMonth('2024-07')).toBe('2024-07-01')
  })

  it('monthsAgo cuenta meses calendario y cruza el año', () => {
    const from = new Date(2024, 0, 15) // 15 de enero de 2024
    expect(monthsAgo(11, from)).toBe('2023-02-01')
    expect(monthsAgo(0, from)).toBe('2024-01-01')
  })
})
