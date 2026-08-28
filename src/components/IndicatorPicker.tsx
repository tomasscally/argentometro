import { useMemo, useState } from 'react'
import type { Category, Indicator, IndicatorId, SourceId } from '../types'
import { INDICATORS } from '../data/indicators'
import { SOURCES } from '../data/sources'
import { useGlossary } from '../lib/glossaryContext'

/**
 * Selector de indicadores, en columna a la izquierda del panel.
 *
 * Con 77 indicadores una fila de botones no es navegable: se agrupan, y el
 * usuario elige el criterio. Por **tipo** para buscar «qué mide»; por **fuente**
 * para saber de dónde sale cada número, que es la otra pregunta natural cuando
 * conviven organismos oficiales, agregadores y una fuente académica.
 */

type Grouping = 'tipo' | 'fuente'

const CATEGORY_LABEL: Record<Category, string> = {
  precios: 'Precios e inflación',
  cambiario: 'Cambiario y financiero',
  actividad: 'Actividad y comercio',
  trabajo: 'Trabajo y salarios',
  ingresos: 'Ingresos y pobreza',
  fiscal: 'Fiscal',
  social: 'Social y demografía',
  internacional: 'Comparación internacional',
}

const CATEGORY_ORDER: Category[] = [
  'precios',
  'cambiario',
  'actividad',
  'trabajo',
  'ingresos',
  'fiscal',
  'social',
  'internacional',
]

const SOURCE_ORDER: SourceId[] = [
  'datos-gob-ar',
  'bcra',
  'argentinadatos',
  'cedlas',
  'world-bank',
  'indec',
  'finanzas',
  'estadistica-caba',
]

/** La fuente que se muestra: la de sus series, o la de sus insumos si es calculado. */
function sourcesOf(indicator: Indicator): SourceId[] {
  if (indicator.series.length > 0) {
    return [...new Set(indicator.series.map((s) => s.sourceId))]
  }
  const inputs = indicator.computed?.inputs ?? []
  return [
    ...new Set(
      inputs.flatMap((id) => {
        const dep = INDICATORS.find((i) => i.id === id)
        return dep ? dep.series.map((s) => s.sourceId) : []
      })
    ),
  ]
}

interface Props {
  selectedIds: IndicatorId[]
  onToggle: (id: IndicatorId) => void
  /** Deselecciona todos. Un panel puede quedar sin ningún indicador. */
  onClear: () => void
}

export function IndicatorPicker({ selectedIds, onToggle, onClear }: Props) {
  const [grouping, setGrouping] = useState<Grouping>('tipo')
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return INDICATORS
    return INDICATORS.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.unit.toLowerCase().includes(q)
    )
  }, [query])

  const groups = useMemo(() => {
    if (grouping === 'tipo') {
      return CATEGORY_ORDER.map((category) => ({
        key: category,
        title: CATEGORY_LABEL[category],
        note: undefined as string | undefined,
        items: matches.filter((i) => i.category === category),
      })).filter((g) => g.items.length > 0)
    }
    return SOURCE_ORDER.map((sourceId) => ({
      key: sourceId,
      title: SOURCES[sourceId].organismo,
      note: LEVEL_NOTE[SOURCES[sourceId].level],
      items: matches.filter((i) => sourcesOf(i).includes(sourceId)),
    })).filter((g) => g.items.length > 0)
  }, [grouping, matches])

  return (
    <aside className="card flex flex-col gap-3 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-medium text-gray-300">
            Indicadores
            <span className="text-gray-600 font-normal"> · {INDICATORS.length}</span>
          </h2>
          {selectedIds.length > 0 && (
            <button
              onClick={onClear}
              className="text-[10px] text-gray-500 hover:text-gray-300 underline"
            >
              eliminar indicadores
            </button>
          )}
        </div>

        <label className="sr-only" htmlFor="buscar-indicador">
          Buscar indicador
        </label>
        <input
          id="buscar-indicador"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="input text-xs py-1.5"
        />

        {/* Los dos criterios de agrupación que el usuario puede necesitar. */}
        <div
          role="group"
          aria-label="Agrupar indicadores por"
          className="flex items-center gap-1 text-[11px]"
        >
          <span className="text-gray-600">Agrupar por</span>
          {(['tipo', 'fuente'] as Grouping[]).map((g) => (
            <button
              key={g}
              onClick={() => setGrouping(g)}
              aria-pressed={grouping === g}
              className={`px-2 py-0.5 rounded border transition-colors ${
                grouping === g
                  ? 'bg-gray-800 text-gray-200 border-gray-600'
                  : 'bg-transparent text-gray-500 border-gray-800 hover:text-gray-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-gray-600">Ningún indicador coincide con «{query}».</p>
      )}

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-1">
            <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
              {group.title}
              <span className="text-gray-700 normal-case tracking-normal">
                {' '}
                · {group.items.length}
              </span>
            </h3>
            {group.note && (
              <p className="text-[10px] text-gray-600 leading-snug">{group.note}</p>
            )}
            <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
              {group.items.map((indicator) => (
                <li key={indicator.id}>
                  <IndicatorRow
                    indicator={indicator}
                    active={selectedIds.includes(indicator.id)}
                    onToggle={onToggle}
                    showSource={grouping === 'tipo'}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  )
}

const LEVEL_NOTE: Record<string, string> = {
  primaria: 'Organismo que produce el dato',
  'secundaria-oficial': 'Organismo público que republica dato de otro',
  agregador: 'Tercero que redistribuye dato de otro',
  academica: 'Estimaciones propias sobre microdatos, metodología armonizada',
}

const SOURCE_SHORT: Record<SourceId, string> = {
  'datos-gob-ar': 'datos.gob.ar',
  bcra: 'BCRA',
  argentinadatos: 'ArgentinaDatos',
  'world-bank': 'Banco Mundial',
  cedlas: 'CEDLAS',
  indec: 'INDEC',
  finanzas: 'Finanzas',
  'estadistica-caba': 'CABA',
}

function IndicatorRow({
  indicator,
  active,
  onToggle,
  showSource,
}: {
  indicator: Indicator
  active: boolean
  onToggle: (id: IndicatorId) => void
  showSource: boolean
}) {
  const sources = sourcesOf(indicator)
  const openGlossary = useGlossary()

  return (
    <button
      onClick={() => onToggle(indicator.id)}
      aria-pressed={active}
      title={indicator.originLabel ?? indicator.description}
      className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded border text-xs transition-colors ${
        active
          ? 'border-transparent'
          : 'border-transparent text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
      }`}
      style={
        active
          ? {
              backgroundColor: indicator.color + '20',
              borderColor: indicator.color + '70',
              color: indicator.color,
            }
          : undefined
      }
    >
      <span
        className="w-3 h-3 mt-0.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0"
        style={
          active
            ? { borderColor: indicator.color, backgroundColor: indicator.color }
            : { borderColor: '#4b5563' }
        }
      >
        {active && (
          <svg width="7" height="7" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path
              d="M1 4l2 2 4-4"
              stroke="#0b1015"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block leading-snug">{indicator.label}</span>
        <span className="block text-[10px] text-gray-600 truncate">
          {indicator.unit}
          {showSource && sources.length > 0 && (
            <> · {sources.map((s) => SOURCE_SHORT[s]).join(', ')}</>
          )}
          {indicator.computed && (
            <>
              {' · '}
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  openGlossary('calculado')
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  e.preventDefault()
                  e.stopPropagation()
                  openGlossary('calculado')
                }}
                className="underline decoration-dotted underline-offset-2 hover:text-gray-400 cursor-pointer"
              >
                calculado
              </span>
            </>
          )}
        </span>
      </span>
    </button>
  )
}
