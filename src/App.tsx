import { useCallback, useEffect, useState } from 'react'
import type { DateRange } from './types'
import { Header } from './components/Header'
import { DateRangePicker } from './components/DateRangePicker'
import { GovernmentLegend } from './components/GovernmentLegend'
import { PanelBoard } from './components/PanelBoard'
import { SourcesPanel } from './components/SourcesPanel'
import { MethodologyPanel } from './components/MethodologyPanel'
import { todayISO } from './lib/dates'
import { readHash, writeHash, type PanelState, type ViewState } from './lib/urlState'
import { GlossaryContext } from './lib/glossaryContext'
import { CafecitoButton } from './components/CafecitoButton'
import { registrarPanel } from './lib/analytics'
import type { GlossaryTermId } from './lib/glossary'

type Panel = 'datos' | 'fuentes' | 'metodologia'

const DEFAULT_PANEL: PanelState = {
  indicators: ['inflation'],
  normalized: false,
  logScale: false,
  adjust: 'none',
  cumulative: false,
}

const DEFAULT_STATE: ViewState = {
  panels: [DEFAULT_PANEL],
  range: { start: '2003-01-01', end: todayISO() },
  governments: [],
}

export default function App() {
  const [view, setView] = useState<ViewState>(() => readHash(DEFAULT_STATE))
  const [panel, setPanel] = useState<Panel>('datos')
  const [glossaryTarget, setGlossaryTarget] = useState<GlossaryTermId | null>(null)

  /** Una marca de una tabla abre la metodología en el término que corresponde. */
  const openGlossary = useCallback((term: GlossaryTermId) => {
    setGlossaryTarget(term)
    setPanel('metodologia')
  }, [])

  // RF-7.1 — el estado viaja en la URL: pegarla reproduce la vista.
  useEffect(() => {
    writeHash(view)
  }, [view])

  // Una vista medida por panel abierto, incluido el inicial. El hash cambia con
  // cada control y no sirve como unidad de medición.
  useEffect(() => {
    registrarPanel(panel)
  }, [panel])

  // Volver o avanzar en el navegador cambia la vista.
  useEffect(() => {
    const onPop = () => setView(readHash(DEFAULT_STATE))
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('hashchange', onPop)
    }
  }, [])

  const setRange = useCallback(
    (range: DateRange, governments: string[] = []) =>
      setView((v) => ({ ...v, range, governments })),
    []
  )

  const setPanels = useCallback(
    (panels: PanelState[]) => setView((v) => ({ ...v, panels })),
    []
  )

  return (
    <GlossaryContext.Provider value={openGlossary}>
      <div className="min-h-screen flex flex-col">
      <Header
        panel={panel}
        onPanel={(next) => {
          setPanel(next)
          if (next !== 'metodologia') setGlossaryTarget(null)
        }}
      />

      <main
        id="contenido"
        className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-4"
      >
        {panel === 'fuentes' && <SourcesPanel />}
        {panel === 'metodologia' && <MethodologyPanel target={glossaryTarget} />}
        {panel === 'datos' && (
          <>
            <div className="flex flex-col gap-3">
              <DateRangePicker
                value={view.range}
                governments={view.governments}
                onChange={setRange}
              />
              <GovernmentLegend
                dateRange={view.range}
                selected={view.governments}
              />
            </div>

            <PanelBoard
              dateRange={view.range}
              panels={view.panels}
              onPanelsChange={setPanels}
            />
          </>
        )}

        <footer className="text-center text-xs text-gray-600 py-4 border-t border-gray-800">
          Datos de organismos oficiales y fuentes aprobadas. La aplicación no los
          modifica más allá de los cálculos declarados.{' '}
          <button
            onClick={() => setPanel('fuentes')}
            className="text-gray-500 hover:text-gray-300 underline"
          >
            Ver fuentes
          </button>{' '}
          ·{' '}
          <button
            onClick={() => setPanel('metodologia')}
            className="text-gray-500 hover:text-gray-300 underline"
          >
            Metodología
          </button>
          <div className="mt-4">
            <CafecitoButton />
          </div>
        </footer>
      </main>
      </div>
    </GlossaryContext.Provider>
  )
}
