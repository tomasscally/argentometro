import type { DataPoint, DateRange, Indicator } from '../types'
import { GlossaryBadge } from './GlossaryLink'
import { useGlossary } from '../lib/glossaryContext'
import {
  governmentsWithoutEnoughData,
  metricsByGovernment,
  type GovernmentMetrics,
} from '../lib/metrics'

interface Props {
  indicator: Indicator
  points: DataPoint[]
  dateRange: DateRange
}

const fmt = (v: number | undefined, decimals: number): string =>
  v === undefined || Number.isNaN(v)
    ? '—'
    : v.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

/** Encabezados precisos según el tipo de indicador (RF-5.2, §7.1). */
function columnsFor(indicator: Indicator): { label: string; get: (m: GovernmentMetrics) => number | undefined }[] {
  switch (indicator.kind) {
    case 'tasa-flujo':
      return [
        { label: 'Acumulada', get: (m) => m.accumulated },
        { label: 'Anualizada', get: (m) => m.annualized },
        { label: 'Máx. mensual', get: (m) => m.max },
      ]
    case 'nivel':
      return [
        { label: 'Inicial', get: (m) => m.first },
        { label: 'Final', get: (m) => m.last },
        { label: 'Punta a punta %', get: (m) => m.endToEnd },
      ]
    case 'tasa-estado':
      return [
        { label: 'Inicial', get: (m) => m.first },
        { label: 'Final', get: (m) => m.last },
        { label: 'Cambio p.p.', get: (m) => m.ppChange },
        { label: 'Promedio', get: (m) => m.average },
      ]
  }
}

const METHOD_NOTE: Record<Indicator['kind'], string> = {
  'tasa-flujo':
    'Acumulada por productoria de las variaciones del período, y su equivalente anualizada. No se promedian variaciones mensuales.',
  nivel: 'Variación punta a punta entre el primer y el último dato disponible del período.',
  'tasa-estado':
    'Cambio en puntos porcentuales entre el primer y el último dato, y promedio simple de las observaciones.',
}

export function SummaryStats({ indicator, points, dateRange }: Props) {
  const openGlossary = useGlossary()
  const rows = metricsByGovernment(points, indicator, dateRange)
  const insufficient = governmentsWithoutEnoughData(points, dateRange)
  if (rows.length === 0 && insufficient.length === 0) return null

  const columns = columnsFor(indicator)

  return (
    <div className="card">
      <h3 className="text-xs font-medium text-gray-400 mb-3">
        Comparación por gestión — {indicator.label}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-600 border-b border-gray-800">
              <th className="text-left pb-2 font-medium">Presidente</th>
              {columns.map((c) => (
                <th key={c.label} className="text-right pb-2 font-medium whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              <th className="text-right pb-2 font-medium">
                <button
                  type="button"
                  onClick={() => openGlossary('observaciones')}
                  className="underline decoration-dotted underline-offset-2 hover:text-gray-400"
                >
                  Obs.
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.government.id} className="border-b border-gray-800/50">
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: m.government.color }}
                    />
                    <span className="text-gray-300">{m.government.name}</span>
                    {/* L7 — la gestión en curso no es comparable con las completas. */}
                    {m.ongoing && (
                      <GlossaryBadge
                        term="en-curso"
                        className="text-gray-500 border-gray-700"
                      >
                        en curso
                      </GlossaryBadge>
                    )}
                    {/* RF-6.6 — la ventana cruza un quiebre metodológico. */}
                    {m.crossesBreak && (
                      <GlossaryBadge
                        term="quiebre"
                        className="text-amber-500/80 border-amber-800/60"
                      >
                        quiebre
                      </GlossaryBadge>
                    )}
                    {/* RF-6.3 — período a caballo de la transición. */}
                    {m.straddling > 0 && (
                      <GlossaryBadge
                        term="a-caballo"
                        className="text-gray-500 border-gray-700"
                      >
                        a caballo
                      </GlossaryBadge>
                    )}
                    {/* Faltan observaciones del período: la acumulada es incompleta. */}
                    {m.missing > 0 && (
                      <GlossaryBadge
                        term="faltan"
                        className="text-amber-500/80 border-amber-800/60"
                      >
                        faltan {m.missing}
                      </GlossaryBadge>
                    )}
                    {/* La ventana visible recorta la gestión: la métrica es parcial. */}
                    {m.clipped && (
                      <GlossaryBadge
                        term="recortado"
                        className="text-gray-500 border-gray-700"
                      >
                        recortado
                      </GlossaryBadge>
                    )}
                  </span>
                </td>
                {columns.map((c) => (
                  <td
                    key={c.label}
                    className="py-2 text-right text-gray-300 tabular-nums whitespace-nowrap"
                  >
                    {fmt(c.get(m), indicator.decimals)}
                  </td>
                ))}
                <td className="py-2 text-right tabular-nums">
                  <span className={m.missing > 0 ? 'text-amber-500/80' : 'text-gray-600'}>
                    {m.count}
                    {m.missing > 0 && (
                      <span className="text-gray-700">/{m.expected}</span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* RF-6.4 — las gestiones sin observaciones suficientes se listan aparte. */}
      {insufficient.length > 0 && (
        <p className="mt-2 text-[10px] text-gray-600">
          Sin datos suficientes en el período:{' '}
          {insufficient.map((g) => g.name).join(', ')}.
        </p>
      )}
      {/* RF-5.4 — nota metodológica al pie de cada tabla. */}
      <p className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-600 leading-relaxed">
        Unidad: {indicator.unit}. {METHOD_NOTE[indicator.kind]}
      </p>
    </div>
  )
}
