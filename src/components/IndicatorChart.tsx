import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DateRange, Indicator, IndicatorId, MethodologyBreak } from '../types'
import { GOVERNMENTS, governmentAt, governmentsInRange } from '../data/governments'
import { SOURCES } from '../data/sources'
import {
  buildRows,
  fromTime,
  normalizeSegments,
  segmentsFor,
  toTime,
  valueAt,
  axisTicks,
  type Segment,
} from '../lib/segments'
import type { IndicatorState } from '../hooks/useIndicatorData'

export interface ChartSeries {
  indicator: Indicator
  state: IndicatorState
}

interface Props {
  series: ChartSeries[]
  dateRange: DateRange
  /** Controlados desde arriba para que viajen en la URL (RF-7.1). */
  normalized: boolean
  onNormalizedChange: (value: boolean) => void
  logScale: boolean
  onLogScaleChange: (value: boolean) => void
  onRetry: () => void
  onExportCsv: () => void
}

interface VisibleBreak extends MethodologyBreak {
  indicatorId: IndicatorId
  indicatorLabel: string
}

function breaksInRange(series: ChartSeries[], range: DateRange): VisibleBreak[] {
  return series
    .flatMap((s) =>
      s.indicator.breaks
        .filter((b) => b.date >= range.start && b.date <= range.end)
        .map((b) => ({
          ...b,
          indicatorId: s.indicator.id,
          indicatorLabel: s.indicator.label,
        }))
    )
    .sort((a, b) => a.date.localeCompare(b.date))
}

function formatAxisDate(value: string, spanYears: number): string {
  try {
    const d = parseISO(value)
    if (spanYears > 8) return format(d, 'yyyy')
    if (spanYears > 2) return format(d, 'MMM yy', { locale: es })
    return format(d, 'MMM yyyy', { locale: es })
  } catch {
    return value
  }
}

function formatValue(value: number, decimals: number): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function ChartTooltip({
  active,
  label,
  series,
  segments,
  normalized,
  breaks,
}: {
  active?: boolean
  label?: number
  series: ChartSeries[]
  segments: Segment[]
  normalized: boolean
  breaks: VisibleBreak[]
}) {
  if (!active || typeof label !== 'number') return null
  const date = fromTime(label)
  const gov = governmentAt(date)
  // El valor se toma de los segmentos, no del payload: así una serie de menor
  // frecuencia no desaparece del tooltip en las fechas donde no mide.
  const rows = series
    .map((s) => ({ s, value: valueAt(segments, s.indicator.id, date) }))
    .filter((r): r is { s: ChartSeries; value: number } => r.value !== undefined)

  if (rows.length === 0) return null

  // RF-3.23 — si el punto cae en un tramo con nota metodológica, se repite acá.
  const activeBreak = [...breaks].reverse().find((b) => b.date <= date)

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs min-w-[200px] max-w-[300px]">
      <p className="text-gray-400 mb-2 font-medium">
        {format(parseISO(date), 'MMMM yyyy', { locale: es })}
      </p>
      {rows.map(({ s, value }) => (
        <div key={s.indicator.id} className="flex items-center justify-between gap-3 mb-1">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: s.indicator.color }}
            />
            <span className="text-gray-300">{s.indicator.label}</span>
          </span>
          <span className="font-semibold text-white tabular-nums">
            {normalized
              ? `${formatValue(value, 1)} (base 100)`
              : `${formatValue(value, s.indicator.decimals)} ${s.indicator.unit}`}
          </span>
        </div>
      ))}
      {gov && (
        <p className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: gov.color }} />
          <span className="text-gray-300">{gov.name}</span>
        </p>
      )}
      {activeBreak && (
        <p className="mt-2 pt-2 border-t border-gray-800 text-[10px] text-amber-400/90 leading-snug">
          {activeBreak.short}
        </p>
      )}
    </div>
  )
}

interface EndLabelProps {
  index?: number
  x?: number
  y?: number
}

/**
 * Dibuja la etiqueta solo en el último punto de la serie. Recharts invoca el
 * contenido una vez por punto, así que se descarta todo lo demás.
 */
function renderEndLabel(props: unknown, segment: Segment, dy: number) {
  const { index, x, y } = (props ?? {}) as EndLabelProps
  if (index !== segment.points.length - 1) return null
  if (typeof x !== 'number' || typeof y !== 'number') return null
  return (
    <text
      x={x + 6}
      y={y + dy}
      fill={segment.color}
      fontSize={10}
      fontWeight={600}
      dominantBaseline="middle"
    >
      {segment.shortLabel}
    </text>
  )
}

/**
 * Desplazamientos verticales para que las etiquetas de fin de línea no se pisen.
 *
 * Cuando varias series terminan en valores parecidos —cuatro medidas de
 * inflación converger es lo normal— sus etiquetas caen unas sobre otras y se
 * vuelven ilegibles. Se agrupan las que quedan cerca y se separan en escalera.
 */
function endLabelOffsets(segments: Segment[]): Map<string, number> {
  const last = segments.filter((s) => s.isLast && s.points.length > 0)
  const finals = last.map((s) => ({
    key: s.key,
    value: s.points[s.points.length - 1].value,
  }))
  if (finals.length < 2) return new Map(finals.map((f) => [f.key, 0]))

  /*
   * El umbral se mide contra el rango vertical del gráfico, no contra la
   * dispersión de los valores finales: dos etiquetas se pisan si sus valores
   * distan menos de una fracción del eje, y eso no depende de cuán juntos
   * terminen entre sí. Calcularlo sobre los finales dejaba un umbral minúsculo
   * justo cuando las series convergían, que es el caso que hay que resolver.
   */
  const allValues = segments.flatMap((s) => s.points.map((p) => p.value))
  const axisRange = Math.max(...allValues) - Math.min(...allValues)
  const threshold = axisRange > 0 ? axisRange / 22 : Infinity

  finals.sort((a, b) => b.value - a.value)
  const offsets = new Map<string, number>()
  let cluster = 0
  for (let i = 0; i < finals.length; i++) {
    if (i > 0) {
      cluster = finals[i - 1].value - finals[i].value >= threshold ? 0 : cluster + 1
    }
    offsets.set(finals[i].key, cluster * 12)
  }
  return offsets
}

export function IndicatorChart({
  series,
  dateRange,
  normalized: userNormalized,
  onNormalizedChange,
  logScale,
  onLogScaleChange,
  onRetry,
  onExportCsv,
}: Props) {
  const [highlighted, setHighlighted] = useState<IndicatorId | null>(null)

  const units = new Set(series.map((s) => s.indicator.unit))
  const multi = series.length > 1
  const forcedNormalization = multi && units.size > 1
  // RF-3.6 — con una sola serie la normalización no aplica, aunque quede
  // encendida en el estado: no se muestra un indicador único normalizado.
  const normalized = forcedNormalization || (multi && userNormalized)

  const loading = series.some((s) => s.state.status === 'cargando')
  const failed = series.filter((s) => s.state.status === 'error')

  const segments = useMemo(() => {
    const raw = series.flatMap((s) => segmentsFor(s.indicator, s.state.points))
    return normalized ? normalizeSegments(raw) : raw
  }, [series, normalized])

  const rows = useMemo(() => buildRows(segments), [segments])
  const breaks = useMemo(() => breaksInRange(series, dateRange), [series, dateRange])

  const spanYears = useMemo(() => {
    if (rows.length < 2) return 1
    return Number(rows[rows.length - 1].date.slice(0, 4)) - Number(rows[0].date.slice(0, 4))
  }, [rows])

  /**
   * RF-3.3 — el eje es temporal, no categórico. Con un eje de categorías las
   * bandas y las marcas se ubican en la posición de una fecha que tiene que
   * existir entre los datos: una serie mensual no tiene el 10 de diciembre, y
   * la banda de la gestión quedaría desplazada. Con el eje en milisegundos, la
   * posición es la fecha real, exista o no un punto ahí.
   */
  const domain = useMemo<[number, number]>(
    () => [toTime(dateRange.start), toTime(dateRange.end)],
    [dateRange]
  )
  const ticks = useMemo(() => axisTicks(domain[0], domain[1]), [domain])
  const labelOffsets = useMemo(() => endLabelOffsets(segments), [segments])

  const bands = useMemo(
    () =>
      governmentsInRange(dateRange.start, dateRange.end).map((g) => ({
        ...g,
        x1: g.startDate < dateRange.start ? dateRange.start : g.startDate,
        x2: g.endDate === null || g.endDate > dateRange.end ? dateRange.end : g.endDate,
      })),
    [dateRange]
  )

  // RF-3.2 — línea punteada en cada traspaso visible.
  const transitions = useMemo(
    () =>
      GOVERNMENTS.filter(
        (g) => g.startDate > dateRange.start && g.startDate <= dateRange.end
      ),
    [dateRange]
  )

  // RF-3.10 — el eje logarítmico solo tiene sentido con valores positivos.
  const allPositive = useMemo(
    () => segments.every((s) => s.points.every((p) => p.value > 0)),
    [segments]
  )
  const useLog = logScale && allPositive

  // Sin indicadores elegidos no falta el dato: falta la elección. Decirlo con
  // el mismo mensaje que un período sin datos confundiría dos cosas distintas.
  const nothingSelected = series.length === 0
  const empty = !loading && !nothingSelected && rows.length === 0 && failed.length === 0

  return (
    <div className="card flex flex-col" style={{ minHeight: 440 }}>
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        {/* RF-3.31 / RF-3.36 — resaltar una serie sin ocultar las demás. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {series.map((s) => (
            <button
              key={s.indicator.id}
              onMouseEnter={() => setHighlighted(s.indicator.id)}
              onMouseLeave={() => setHighlighted(null)}
              onFocus={() => setHighlighted(s.indicator.id)}
              onBlur={() => setHighlighted(null)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-200 rounded px-1 -mx-1"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.indicator.color }}
              />
              {s.indicator.label}
              {s.state.lastUpdated && (
                <span className="text-[10px] text-gray-600 font-normal">
                  último dato {s.state.lastUpdated}
                </span>
              )}
              {/* L9 — la copia local tiene una fecha y se muestra. */}
              {s.state.fetchedAt && (
                <span
                  className="text-[10px] text-gray-700 font-normal"
                  title={`Copia local tomada el ${s.state.fetchedAt}`}
                >
                  · copia {s.state.fetchedAt.slice(0, 10)}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {multi && (
            <button
              onClick={() => onNormalizedChange(!userNormalized)}
              disabled={forcedNormalization}
              title={
                forcedNormalization
                  ? 'Normalización automática: las unidades difieren'
                  : 'Comparar en base 100'
              }
              className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                normalized
                  ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                  : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'
              } ${forcedNormalization ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
            >
              {normalized ? 'Base 100 ✓' : 'Base 100'}
            </button>
          )}
          <button
            onClick={() => onLogScaleChange(!logScale)}
            disabled={!allPositive}
            title={
              allPositive
                ? 'Escala logarítmica en el eje vertical'
                : 'La escala logarítmica requiere valores positivos'
            }
            className={`text-[11px] px-2 py-1 rounded border transition-colors ${
              useLog
                ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'
            } ${allPositive ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
          >
            {useLog ? 'Log ✓' : 'Log'}
          </button>
          {!multi && series[0] && (
            <span className="text-[10px] text-gray-600">{series[0].indicator.unit}</span>
          )}
          {/* RF-7.3 — el CSV lleva fuentes, procedencia y notas de quiebre. */}
          <button
            onClick={onExportCsv}
            disabled={rows.length === 0}
            title="Descargar los datos de esta vista, con sus fuentes y notas"
            className="text-[11px] px-2 py-1 rounded border bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300 disabled:opacity-40"
          >
            CSV
          </button>
        </div>
      </div>

      {/* RF-2.2 — el fallo se muestra con su motivo y con qué hacer al respecto. */}
      {failed.length > 0 && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-red-900/70 bg-red-950/30 px-3 py-2 text-xs"
        >
          <p className="text-red-200 font-medium mb-1">
            No se pudieron cargar {failed.length === 1 ? 'estos datos' : `${failed.length} series`}
          </p>
          <ul className="list-none p-0 m-0 flex flex-col gap-0.5">
            {failed.map((s) => (
              <li key={s.indicator.id} className="text-red-300/90">
                <span className="font-medium">{s.indicator.label}</span> · {s.state.error}
              </li>
            ))}
          </ul>
          <p className="text-red-300/70 mt-1.5 leading-relaxed">
            Si estás corriendo la aplicación en desarrollo, revisá que el servidor
            siga levantado: al reiniciarse, los pedidos en curso se cortan.
          </p>
          <button
            onClick={onRetry}
            className="mt-2 text-[11px] px-2 py-1 rounded border border-red-800 text-red-200 hover:bg-red-900/40"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="flex-1" style={{ minHeight: 320 }}>
        {nothingSelected ? (
          <div
            className="h-full flex flex-col items-center justify-center gap-1 text-center"
            style={{ minHeight: 320 }}
          >
            <p className="text-sm text-gray-500">Sin indicadores seleccionados</p>
            <p className="text-xs text-gray-600">
              Elegí uno o más en el panel de la izquierda para dibujarlos acá.
            </p>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center" style={{ minHeight: 320 }}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Cargando datos…</span>
            </div>
          </div>
        ) : empty ? (
          <div
            className="h-full flex items-center justify-center text-gray-600 text-sm"
            style={{ minHeight: 320 }}
          >
            Sin datos para el período seleccionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <LineChart
              data={rows}
              margin={{
                top: 34,
                // Espacio a la derecha para las etiquetas de fin de línea.
                right: multi ? 108 : 18,
                bottom: 4,
                left: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

              {bands.map((g) => (
                <ReferenceArea
                  key={g.id}
                  x1={toTime(g.x1)}
                  x2={toTime(g.x2)}
                  fill={g.color}
                  fillOpacity={0.1}
                  stroke="none"
                  label={{
                    value: g.shortName,
                    position: 'insideTopLeft',
                    fontSize: 9,
                    fill: g.color,
                    fontWeight: 600,
                    dy: 4,
                    dx: 4,
                  }}
                />
              ))}

              {transitions.map((g) => (
                <ReferenceLine
                  key={`t-${g.id}`}
                  x={toTime(g.startDate)}
                  stroke={g.color}
                  strokeDasharray="4 3"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                />
              ))}

              {/* RF-3.21 — marca vertical con etiqueta sobre el gráfico mismo.
                  RF-3.25 — las etiquetas se escalonan para no superponerse. */}
              {breaks.map((b, i) => (
                <ReferenceLine
                  key={`${b.indicatorId}-${b.date}`}
                  x={toTime(b.date)}
                  stroke="#d9a441"
                  strokeDasharray="4 3"
                  strokeWidth={1.25}
                  strokeOpacity={0.85}
                  label={{
                    value: b.short,
                    position: 'top',
                    fontSize: 8.5,
                    fill: '#d9a441',
                    fontWeight: 500,
                    dy: -(i % 3) * 11,
                  }}
                />
              ))}

              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={domain}
                ticks={ticks}
                allowDataOverflow
                tickFormatter={(v: number) => formatAxisDate(fromTime(v), spanYears)}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                scale={useLog ? 'log' : 'auto'}
                domain={useLog ? ['auto', 'auto'] : undefined}
                allowDataOverflow={false}
                tickFormatter={(v: number) =>
                  Math.abs(v) >= 10000 ? `${(v / 1000).toFixed(0)}k` : formatValue(v, 0)
                }
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    series={series}
                    segments={segments}
                    normalized={normalized}
                    breaks={breaks}
                  />
                }
                cursor={{ stroke: '#374151', strokeWidth: 1 }}
              />

              {/* Un trazo por tramo continuo: los huecos reales quedan sin línea,
                  y las series de baja frecuencia no se cortan (RF-3.11, RF-3.33). */}
              {segments.map((segment) => {
                const dimmed =
                  highlighted !== null && highlighted !== segment.indicatorId
                return (
                  <Line
                    key={segment.key}
                    type="monotone"
                    dataKey={segment.key}
                    stroke={segment.color}
                    strokeWidth={highlighted === segment.indicatorId ? 2.6 : 2}
                    strokeOpacity={dimmed ? 0.25 : 1}
                    strokeDasharray={segment.dashed ? '5 3' : undefined}
                    /* En series con pocas observaciones se marcan los puntos:
                       de otro modo no se ve dónde hay dato real y dónde la
                       línea solo une dos relevamientos lejanos. */
                    dot={segment.points.length <= 60 ? { r: 2.2 } : false}
                    connectNulls
                    activeDot={{ r: 4, fill: segment.color, strokeWidth: 0 }}
                    isAnimationActive={false}
                    /* RF-3.36 — etiqueta al final del último tramo de cada
                       serie: con más de cuatro curvas el color no alcanza para
                       distinguirlas, así que la identidad la carga el rótulo. */
                    label={
                      segment.isLast && series.length > 1
                        ? {
                            position: 'right',
                            content: (props: unknown) =>
                              renderEndLabel(
                                props,
                                segment,
                                labelOffsets.get(segment.key) ?? 0
                              ),
                          }
                        : undefined
                    }
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {breaks.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-800">
          <p className="text-[10px] text-gray-500 mb-1 font-medium">
            Cambios de metodología en el período
          </p>
          <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
            {breaks.map((b) => (
              <li key={`${b.indicatorId}-${b.date}-li`} className="text-[10px] text-gray-600">
                <span className="text-amber-500/80">▎</span> {b.short}
                {series.length > 1 && (
                  <span className="text-gray-700"> · {b.indicatorLabel}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-700 mt-1.5">
            El trazo punteado marca los tramos medidos con una metodología anterior a
            la vigente. Los huecos son períodos sin dato publicado: no se rellenan.
          </p>
        </div>
      )}

      {series.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800 text-[10px] text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <span key={s.indicator.id}>
              <span style={{ color: s.indicator.color }}>■</span>{' '}
              {s.state.sourceIds.map((id) => SOURCES[id].organismo).join(', ') || '—'}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
