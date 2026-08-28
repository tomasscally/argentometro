import { describe, expect, it } from 'vitest'
import { CsvParseError, normalizeDate, parseNumber, parseRows } from '../csvParser'

describe('normalizeDate', () => {
  it('acepta los cuatro formatos declarados (RF-8.6)', () => {
    expect(normalizeDate('2024-03-15')).toBe('2024-03-15')
    expect(normalizeDate('2024-03')).toBe('2024-03-01')
    expect(normalizeDate('15/03/2024')).toBe('2024-03-15')
    expect(normalizeDate('3/2024')).toBe('2024-03-01')
  })

  it('rechaza meses y días fuera de rango', () => {
    expect(normalizeDate('15/13/2024')).toBeNull()
    expect(normalizeDate('32/01/2024')).toBeNull()
    expect(normalizeDate('13/2024')).toBeNull()
  })

  it('rechaza basura', () => {
    expect(normalizeDate('marzo 2024')).toBeNull()
    expect(normalizeDate('')).toBeNull()
  })
})

describe('parseNumber', () => {
  it('acepta formato anglosajón', () => {
    expect(parseNumber('1234.56')).toBe(1234.56)
    expect(parseNumber('0')).toBe(0)
    expect(parseNumber('-2.5')).toBe(-2.5)
  })

  it('acepta formato argentino con separador de miles', () => {
    // El parser anterior devolvía 1.234 para esta entrada.
    expect(parseNumber('1.234,56')).toBe(1234.56)
    expect(parseNumber('1.234.567,89')).toBe(1234567.89)
    expect(parseNumber('0,5')).toBe(0.5)
  })

  it('rechaza valores no numéricos', () => {
    expect(parseNumber('n/d')).toBeNull()
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('12,34,56')).toBeNull()
  })
})

describe('parseRows', () => {
  it('acepta encabezados en español e inglés', () => {
    expect(parseRows([{ fecha: '2024-01', valor: '1,5' }])).toEqual([
      { date: '2024-01-01', value: 1.5 },
    ])
    expect(parseRows([{ date: '2024-01', value: '1.5' }])).toEqual([
      { date: '2024-01-01', value: 1.5 },
    ])
  })

  it('ordena por fecha', () => {
    const rows = [
      { fecha: '2024-03', valor: '3' },
      { fecha: '2024-01', valor: '1' },
      { fecha: '2024-02', valor: '2' },
    ]
    expect(parseRows(rows).map((p) => p.value)).toEqual([1, 2, 3])
  })

  it('conserva el valor cero', () => {
    expect(parseRows([{ fecha: '2024-01', valor: '0' }])[0].value).toBe(0)
  })

  it('rechaza la carga completa ante una fila inválida, con su número (RF-8.7)', () => {
    const rows = [
      { fecha: '2024-01', valor: '1' },
      { fecha: 'ayer', valor: '2' },
    ]
    expect(() => parseRows(rows)).toThrow(CsvParseError)
    expect(() => parseRows(rows)).toThrow(/Fila 3/)
  })

  it('rechaza un archivo sin las columnas requeridas', () => {
    expect(() => parseRows([{ periodo: '2024-01', dato: '1' }])).toThrow(/columnas/)
  })

  it('rechaza un archivo sin filas', () => {
    expect(() => parseRows([])).toThrow(/no tiene filas/)
  })
})
