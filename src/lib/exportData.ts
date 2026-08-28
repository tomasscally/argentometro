import type { DataPoint, Indicator, MethodologyBreak } from '../types'
import { SOURCES } from '../data/sources'

/**
 * RF-7.3 — exportación a CSV con la cabecera de procedencia.
 *
 * Un archivo exportado tiene que poder rastrearse hasta su fuente sin la
 * aplicación al lado, y tiene que llevar las notas de quiebre: un gráfico o una
 * tabla compartidos no pueden perder la advertencia (RF-3.27).
 */

export interface ExportSeries {
  indicator: Indicator
  points: DataPoint[]
  fetchedAt: string | null
}

function csvEscape(value: string): string {
  return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function breakLines(indicator: Indicator): string[] {
  return indicator.breaks.map(
    (b: MethodologyBreak) => `# ${indicator.label} · ${b.date}: ${b.short}`
  )
}

export function buildCsv(series: ExportSeries[], generatedAt: string): string {
  const lines: string[] = [
    '# Argentómetro',
    `# Exportado: ${generatedAt}`,
    '# Los datos provienen de las fuentes indicadas y no fueron modificados',
    '# más allá de la escala declarada.',
    '#',
  ]

  for (const s of series) {
    const organismos = [...new Set(s.indicator.series.map((r) => SOURCES[r.sourceId].organismo))]
    const ids = s.indicator.series.map((r) => r.seriesId)
    lines.push(`# ${s.indicator.label} (${s.indicator.unit})`)
    lines.push(`#   fuente: ${organismos.join(', ')}`)
    lines.push(`#   series: ${ids.join(', ')}`)
    for (const r of s.indicator.series) {
      lines.push(`#   url: ${SOURCES[r.sourceId].url}`)
      break
    }
    if (s.fetchedAt) lines.push(`#   copia tomada: ${s.fetchedAt}`)
    if (s.indicator.originLabel) lines.push(`#   origen: ${s.indicator.originLabel}`)
    lines.push(...breakLines(s.indicator).map((l) => `#   ${l.slice(2)}`))
    lines.push('#')
  }

  // Una columna por indicador, una fila por fecha presente en cualquiera.
  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort()
  const index = series.map((s) => new Map(s.points.map((p) => [p.date, p.value])))

  lines.push(['fecha', ...series.map((s) => csvEscape(s.indicator.label))].join(','))
  for (const date of dates) {
    const row = [date, ...index.map((m) => (m.has(date) ? String(m.get(date)) : ''))]
    lines.push(row.join(','))
  }

  return lines.join('\n')
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Liberar en el próximo tick: revocar de inmediato puede cancelar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
