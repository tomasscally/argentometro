import { useMemo, useState } from 'react'
import type { DataPoint, DateRange, Indicator, IndicatorId } from '../types'
import { INDICATORS, getIndicator } from '../data/indicators'
import { IndicatorChart, type ChartSeries } from './IndicatorChart'
import { IndicatorPicker } from './IndicatorPicker'
import { SummaryStats } from './SummaryStats'
import type { IndicatorState } from '../hooks/useIndicatorData'
import type { PanelState } from '../lib/urlState'
import {
  ADJUSTMENT_LABEL,
  applyAdjustment,
  isAdjustable,
  whyNotAdjustable,
  type Adjustment,
} from '../lib/adjust'
import { buildCsv, downloadText } from '../lib/exportData'
import { CUMULATIVE_UNIT, isCumulable, toCumulative } from '../lib/cumulative'
import { segmentPoints } from '../lib/segments'

interface Props {
  panel: PanelState
  index: number
  total: number
  dateRange: DateRange
  states: Record<string, IndicatorState>
  deflators: { inflation: DataPoint[]; exchangeRate: DataPoint[] }
  onChange: (panel: PanelState) => void
  onRemove: () => void
}

const ADJUSTMENTS: Adjustment[] = ['none', 'inflation', 'usd']

/** Solo los indicadores oficiales entran a las tablas por gestión (RF-3.51). */
function isOfficial(indicator: Indicator): boolean {
  return !indicator.group && !indicator.alternativeTo
}

export function ChartPanel({
  panel,
  index,
  total,
  dateRange,
  states,
  deflators,
  onChange,
  onRemove,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(index === 0)

  const selected = useMemo(
    () => panel.indicators.filter((id) => INDICATORS.some((i) => i.id === id)),
    [panel.indicators]
  )

  /**
   * La corrección se aplica acá, sobre lo que se va a dibujar, y no sobre el
   * dato guardado: es una forma de mirar la serie, no otra serie.
   */
  const { series, tableSeries, adjustNotes } = useMemo(() => {
    const notes: string[] = []
    /*
     * La tabla y el gráfico no reciben lo mismo.
     *
     * La corrección por inflación o por dólar sí le corresponde a la tabla: si
     * se está mirando la recaudación en términos reales, la variación punta a
     * punta tiene que ser la real.
     *
     * El acumulado no: la tabla ya compone por su cuenta, y calcular sobre
     * valores acumulados sería componer dos veces. Por eso la tabla recibe la
     * serie sin acumular.
     */
    const forTable: ChartSeries[] = []

    const out: ChartSeries[] = selected.map((id) => {
      const indicator = getIndicator(id)
      const state = states[id] ?? {
        status: 'cargando' as const,
        points: [],
        error: null,
        sourceIds: [],
        lastUpdated: null,
        fetchedAt: null,
      }

      /*
       * Acumular va antes que corregir: una variación porcentual no se corrige
       * por inflación, y una vez acumulada tampoco. Son transformaciones
       * disjuntas, cada una sobre el tipo de indicador que le corresponde.
       */
      if (panel.cumulative && isCumulable(indicator)) {
        forTable.push({ indicator, state })
        // Con huecos, componer solo lo disponible deja el acumulado por debajo
        // del real: no se puede suponer que en un mes sin dato no hubo variación.
        const tramos = segmentPoints(state.points, indicator.frequency)
        if (tramos.length > 1) {
          notes.push(
            `${indicator.label}: el acumulado no cuenta los períodos sin dato publicado, ` +
              `así que queda por debajo del real`
          )
        }
        return {
          indicator: { ...indicator, unit: CUMULATIVE_UNIT, kind: 'nivel' as const },
          state: { ...state, points: toCumulative(state.points) },
        }
      }

      if (panel.adjust === 'none') {
        forTable.push({ indicator, state })
        return { indicator, state }
      }

      const razon = whyNotAdjustable(indicator)
      if (razon) {
        notes.push(`${indicator.label}: no se corrige porque ${razon}`)
        forTable.push({ indicator, state })
        return { indicator, state }
      }

      const result = applyAdjustment(panel.adjust, indicator, state.points, deflators)
      if (result.note) notes.push(`${indicator.label}: ${result.note}`)
      const adjusted = {
        indicator: { ...indicator, unit: result.unit },
        state: { ...state, points: result.points },
      }
      forTable.push(adjusted)
      return adjusted
    })
    return { series: out, tableSeries: forTable, adjustNotes: notes }
  }, [selected, states, panel.adjust, panel.cumulative, deflators])

  const toggle = (id: IndicatorId) => {
    // Un panel puede quedar sin ningún indicador: deseleccionar el último es
    // una acción válida, no un caso a impedir.
    const next = panel.indicators.includes(id)
      ? panel.indicators.filter((v) => v !== id)
      : [...panel.indicators, id]
    onChange({ ...panel, indicators: next })
  }

  const anyAdjustable = selected.some((id) => isAdjustable(getIndicator(id)))
  const anyCumulable = selected.some((id) => isCumulable(getIndicator(id)))
  const officialSeries = tableSeries.filter((s) => isOfficial(s.indicator))
  const hasInternational = series.some((s) => s.indicator.category === 'internacional')

  const exportCsv = () => {
    const csv = buildCsv(
      series.map((s) => ({
        indicator: s.indicator,
        points: s.state.points,
        fetchedAt: s.state.fetchedAt,
      })),
      new Date().toISOString()
    )
    downloadText(
      `monitor-estadistico-${index + 1}-${dateRange.start}-a-${dateRange.end}.csv`,
      csv,
      'text/csv'
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {total > 1 && (
            <span className="text-[10px] text-gray-600 font-mono">
              Gráfico {index + 1}
            </span>
          )}
          <button
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerOpen}
            className="btn-secondary text-xs"
          >
            {pickerOpen
              ? 'Ocultar indicadores'
              : selected.length === 0
                ? 'Elegir indicadores'
                : `Elegir indicadores (${selected.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Una variación por período dice cuánto cambió cada mes; el acumulado
              dice cuánto cambió en total, componiendo. */}
          <button
            onClick={() => onChange({ ...panel, cumulative: !panel.cumulative })}
            aria-pressed={panel.cumulative}
            disabled={!anyCumulable}
            title={
              anyCumulable
                ? 'Mostrar el acumulado del período en lugar de la variación de cada período'
                : 'Ninguna de las series seleccionadas es una variación por período'
            }
            className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
              panel.cumulative
                ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                : 'bg-transparent text-gray-500 border-gray-800 hover:text-gray-300'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {panel.cumulative ? 'Acumulado ✓' : 'Acumulado'}
          </button>

          {/* Corregir por inflación o por dólar: solo tiene sentido con alguna
              magnitud en pesos en el panel. */}
          <div
            role="group"
            aria-label="Corregir series"
            className="flex items-center gap-1 text-[11px]"
          >
            <span className="text-gray-600">Corregir</span>
            {ADJUSTMENTS.map((a) => (
              <button
                key={a}
                onClick={() => onChange({ ...panel, adjust: a })}
                aria-pressed={panel.adjust === a}
                disabled={a !== 'none' && !anyAdjustable}
                title={
                  a !== 'none' && !anyAdjustable
                    ? 'Ninguna de las series seleccionadas está en pesos corrientes'
                    : undefined
                }
                className={`px-2 py-0.5 rounded border transition-colors ${
                  panel.adjust === a
                    ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                    : 'bg-transparent text-gray-500 border-gray-800 hover:text-gray-300'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {ADJUSTMENT_LABEL[a]}
              </button>
            ))}
          </div>

          {total > 1 && (
            <button
              onClick={onRemove}
              className="text-[11px] px-2 py-0.5 rounded border border-gray-800 text-gray-500 hover:text-red-300 hover:border-red-900"
            >
              Quitar gráfico
            </button>
          )}
        </div>
      </div>

      {adjustNotes.length > 0 && (
        <ul className="list-none p-0 m-0 flex flex-col gap-0.5">
          {adjustNotes.map((note) => (
            <li key={note} className="text-[11px] text-amber-500/80">
              {note}
            </li>
          ))}
        </ul>
      )}

      <div
        className={
          pickerOpen
            ? 'grid grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)] gap-4 items-start'
            : ''
        }
      >
        {pickerOpen && (
          <IndicatorPicker
            selectedIds={selected}
            onToggle={toggle}
            onClear={() => onChange({ ...panel, indicators: [] })}
          />
        )}

        <div className="flex flex-col gap-4 min-w-0">
          {hasInternational && (
            <aside
              aria-label="Nota sobre comparabilidad entre países"
              className="rounded-lg border border-amber-800/70 bg-amber-950/25 px-3 py-2 text-xs text-amber-200/90 leading-relaxed"
            >
              <strong className="font-semibold">A tener en cuenta.</strong> Cada país
              mide con su propia metodología, y las definiciones pueden cambiar con el
              tiempo dentro de un mismo país. Las series del Banco Mundial buscan
              homogeneizar el procesamiento, no el instrumento de medición, así que los
              valores pueden no ser estrictamente comparables entre países. Conviene
              leer la evolución de cada serie antes que la diferencia de nivel entre
              ellas. Las bandas de gestión corresponden únicamente a la serie argentina.
            </aside>
          )}

          <IndicatorChart
            series={series}
            dateRange={dateRange}
            normalized={panel.normalized}
            onNormalizedChange={(normalized) => onChange({ ...panel, normalized })}
            logScale={panel.logScale}
            onLogScaleChange={(logScale) => onChange({ ...panel, logScale })}
            onRetry={() => window.location.reload()}
            onExportCsv={exportCsv}
          />

          <div
            className={
              officialSeries.length === 1 ? '' : 'grid grid-cols-1 2xl:grid-cols-2 gap-3'
            }
          >
            {officialSeries.map((s) => (
              <SummaryStats
                key={s.indicator.id}
                indicator={s.indicator}
                points={s.state.points}
                dateRange={dateRange}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
