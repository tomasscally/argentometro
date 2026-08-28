import { useMemo } from 'react'
import type { DateRange, IndicatorId } from '../types'
import type { PanelState } from '../lib/urlState'
import { ChartPanel } from './ChartPanel'
import { useIndicatorsData } from '../hooks/useIndicatorData'

interface Props {
  dateRange: DateRange
  panels: PanelState[]
  onPanelsChange: (panels: PanelState[]) => void
}

/** Series que hacen falta para corregir, además de las que el usuario eligió. */
const DEFLATORS: IndicatorId[] = ['inflation', 'exchange_rate']

const EMPTY_PANEL: PanelState = {
  indicators: ['exchange_rate'],
  normalized: false,
  logScale: false,
  adjust: 'none',
  cumulative: false,
}

/**
 * Varios gráficos con una sola ventana de tiempo.
 *
 * No todo tiene sentido en el mismo par de ejes: comparar inflación con reservas
 * obliga a normalizar y pierde las unidades. Con paneles separados cada grupo
 * conserva su escala, y el eje temporal sigue siendo uno solo (RF-3.32).
 */
export function PanelBoard({ dateRange, panels, onPanelsChange }: Props) {
  // Todo lo que hay que leer: lo seleccionado en cualquier panel, más los
  // deflactores si algún panel está corrigiendo.
  const needed = useMemo(() => {
    const ids = new Set<IndicatorId>()
    for (const panel of panels) {
      panel.indicators.forEach((id) => ids.add(id))
      if (panel.adjust !== 'none') DEFLATORS.forEach((id) => ids.add(id))
    }
    return [...ids]
  }, [panels])

  const states = useIndicatorsData(needed, dateRange)

  const deflators = useMemo(
    () => ({
      inflation: states['inflation']?.points ?? [],
      exchangeRate: states['exchange_rate']?.points ?? [],
    }),
    [states]
  )

  const update = (index: number, next: PanelState) => {
    onPanelsChange(panels.map((p, i) => (i === index ? next : p)))
  }

  const remove = (index: number) => {
    onPanelsChange(panels.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      {panels.map((panel, index) => (
        <ChartPanel
          key={index}
          panel={panel}
          index={index}
          total={panels.length}
          dateRange={dateRange}
          states={states}
          deflators={deflators}
          onChange={(next) => update(index, next)}
          onRemove={() => remove(index)}
        />
      ))}

      <button
        onClick={() => onPanelsChange([...panels, EMPTY_PANEL])}
        className="btn-secondary text-xs self-start"
      >
        + Agregar gráfico
      </button>
    </div>
  )
}
