import Papa from 'papaparse'
import type { DataPoint } from '../types'

/**
 * Parser de CSV para la carga administrativa de series (§8.10).
 *
 * No lo usa la aplicación pública: el público no puede cargar series (RF-8.1).
 * Un error de fila rechaza la carga completa; no se acepta una serie
 * parcialmente parseada (RF-8.7).
 */

export class CsvParseError extends Error {
  constructor(message: string, readonly row?: number) {
    super(row === undefined ? message : `Fila ${row}: ${message}`)
    this.name = 'CsvParseError'
  }
}

/** Normaliza a YYYY-MM-DD. Acepta YYYY-MM-DD, YYYY-MM, DD/MM/YYYY y MM/YYYY. */
export function normalizeDate(raw: string): string | null {
  const value = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`

  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    if (+m < 1 || +m > 12 || +d < 1 || +d > 31) return null
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  const my = value.match(/^(\d{1,2})\/(\d{4})$/)
  if (my) {
    const [, m, y] = my
    if (+m < 1 || +m > 12) return null
    return `${y}-${m.padStart(2, '0')}-01`
  }
  return null
}

/**
 * Acepta formato argentino (1.234,56) y anglosajón (1234.56) (RF-8.6).
 * La heurística: si hay coma, la coma es el separador decimal y los puntos
 * son de miles. Si no hay coma, el punto es decimal.
 */
export function parseNumber(raw: string): number | null {
  const value = raw.trim()
  if (value === '') return null
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}

type CsvRow = Record<string, string | undefined>

function pick(row: CsvRow, names: string[]): string | undefined {
  for (const key of Object.keys(row)) {
    if (names.includes(key.trim().toLowerCase())) return row[key]
  }
  return undefined
}

export function parseRows(rows: CsvRow[]): DataPoint[] {
  const points: DataPoint[] = []

  rows.forEach((row, index) => {
    // +2: la fila 1 es el encabezado y el índice arranca en 0.
    const lineNumber = index + 2
    const rawDate = pick(row, ['date', 'fecha'])
    const rawValue = pick(row, ['value', 'valor'])

    if (rawDate === undefined || rawValue === undefined) {
      throw new CsvParseError(
        'faltan las columnas "date" (o "fecha") y "value" (o "valor")',
        lineNumber
      )
    }

    const date = normalizeDate(rawDate)
    if (!date) throw new CsvParseError(`fecha inválida: "${rawDate}"`, lineNumber)

    const value = parseNumber(rawValue)
    if (value === null) {
      throw new CsvParseError(`valor inválido: "${rawValue}"`, lineNumber)
    }

    points.push({ date, value })
  })

  if (points.length === 0) throw new CsvParseError('el archivo no tiene filas de datos')

  points.sort((a, b) => a.date.localeCompare(b.date))
  return points
}

export function parseCsv(file: File): Promise<DataPoint[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        try {
          resolve(parseRows(results.data))
        } catch (err) {
          reject(err)
        }
      },
      error(err) {
        reject(new CsvParseError(err.message))
      },
    })
  })
}
