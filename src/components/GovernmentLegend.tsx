import { governmentsInRange } from '../data/governments'
import type { DateRange } from '../types'

interface Props {
  dateRange: DateRange
  /** Gestiones elegidas explícitamente, para destacarlas. Vacío = ninguna. */
  selected?: string[]
}

/**
 * RF-6.9 — el color identifica a la fuerza política, no valora.
 * RF-10.2 — el apellido acompaña siempre al color: la información no depende
 * solo del color.
 */
export function GovernmentLegend({ dateRange, selected = [] }: Props) {
  const visible = governmentsInRange(dateRange.start, dateRange.end)

  return (
    <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
      {visible.map((g) => (
        <li
          key={g.id}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            selected.includes(g.id)
              ? 'text-gray-100'
              : 'border-gray-700 text-gray-300'
          }`}
          style={
            selected.includes(g.id)
              ? { borderColor: g.color, backgroundColor: g.color + '1f' }
              : undefined
          }
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: g.color }}
            aria-hidden="true"
          />
          {g.name}
          <span className="text-gray-600">({g.party})</span>
          {g.endDate === null && (
            <span className="text-[9px] text-gray-500 border border-gray-700 rounded px-1">
              en curso
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
