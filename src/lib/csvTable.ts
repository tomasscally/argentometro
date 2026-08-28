/**
 * Parseo de CSV con comillas.
 *
 * El dump de metadatos de la API trae descripciones con comas adentro —«IPC.
 * Núcleo. Nacional. Base dic 2016. Mensual.»— así que partir por comas rompe
 * las filas y corre las columnas sin que se note.
 */
export function parseCsvTable(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (quoted) {
      if (c !== '"') {
        field += c
      } else if (text[i + 1] === '"') {
        // Comilla escapada dentro de un campo entrecomillado.
        field += '"'
        i++
      } else {
        quoted = false
      }
      continue
    }

    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') field += c
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Devuelve las filas como objetos, usando la primera fila como encabezado. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsvTable(text)
  if (rows.length === 0) return []
  const header = rows[0]
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    header.forEach((name, i) => {
      record[name] = row[i] ?? ''
    })
    return record
  })
}
