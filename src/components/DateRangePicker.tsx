import type { DateRange } from '../types'
import { GOVERNMENTS, rangeForGovernments } from '../data/governments'
import { endOfMonth, monthsAgo, todayISO } from '../lib/dates'

interface Props {
  value: DateRange
  /** Gestiones elegidas. Vacío significa que el rango no viene de gestiones. */
  governments: string[]
  onChange: (range: DateRange, governments?: string[]) => void
}

interface Preset {
  label: string
  range: () => DateRange
}

/**
 * RF-4.1 y RF-4.3 — los presets describen exactamente lo que hacen.
 * "Últimos 12 meses" es eso, no "año en curso".
 */
const PRESETS: Preset[] = [
  { label: 'Últimos 12 meses', range: () => ({ start: monthsAgo(11), end: todayISO() }) },
  { label: 'Últimos 5 años', range: () => ({ start: monthsAgo(59), end: todayISO() }) },
  { label: 'Serie completa', range: () => ({ start: '2003-01-01', end: todayISO() }) },
]

export function DateRangePicker({ value, governments, onChange }: Props) {
  const today = todayISO()

  /**
   * Las gestiones se acumulan: elegir Alberto Fernández y después Milei muestra
   * los dos períodos, en vez de reemplazar uno por otro. Volver a tocar una la
   * saca de la selección.
   */
  const toggleGovernment = (id: string) => {
    const next = governments.includes(id)
      ? governments.filter((g) => g !== id)
      : [...governments, id]

    if (next.length === 0) {
      onChange({ start: '2003-01-01', end: today }, [])
      return
    }
    const range = rangeForGovernments(next, today)
    if (range) onChange(range, next)
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {PRESETS.map((preset) => {
            const range = preset.range()
            const active =
              governments.length === 0 &&
              range.start === value.start &&
              range.end === value.end
            return (
              <button
                key={preset.label}
                onClick={() => onChange(range, [])}
                aria-pressed={active}
                className={`btn text-xs py-1 px-2.5 ${active ? 'btn-primary' : 'btn-secondary'}`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <label htmlFor="range-start" className="text-gray-500 text-xs">
            Desde
          </label>
          <input
            id="range-start"
            type="month"
            value={value.start.substring(0, 7)}
            max={value.end.substring(0, 7)}
            onChange={(e) =>
              e.target.value && onChange({ ...value, start: `${e.target.value}-01` }, [])
            }
            className="input text-sm py-1"
          />
          <label htmlFor="range-end" className="text-gray-500 text-xs">
            Hasta
          </label>
          <input
            id="range-end"
            type="month"
            value={value.end.substring(0, 7)}
            min={value.start.substring(0, 7)}
            max={today.substring(0, 7)}
            onChange={(e) =>
              // RF-4.2 — el mes de fin es inclusivo: incluye todos sus días.
              e.target.value && onChange({ ...value, end: endOfMonth(e.target.value) }, [])
            }
            className="input text-sm py-1"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-800">
        <span className="text-[11px] text-gray-600 mr-1">Gestiones</span>
        {GOVERNMENTS.map((g) => {
          const active = governments.includes(g.id)
          return (
            <button
              key={g.id}
              onClick={() => toggleGovernment(g.id)}
              aria-pressed={active}
              className={`text-xs py-1 px-2.5 rounded-lg border transition-colors ${
                active ? '' : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
              style={
                active
                  ? {
                      backgroundColor: g.color + '25',
                      borderColor: g.color + '90',
                      color: g.color,
                    }
                  : undefined
              }
            >
              {g.shortName}
            </button>
          )
        })}
        {governments.length > 1 && (
          <span className="text-[10px] text-gray-600 ml-1">
            {governments.length} períodos
          </span>
        )}
      </div>
    </div>
  )
}
