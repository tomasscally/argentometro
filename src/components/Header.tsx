type Panel = 'datos' | 'fuentes' | 'metodologia'

interface Props {
  panel: Panel
  onPanel: (panel: Panel) => void
}

const TABS: { id: Panel; label: string }[] = [
  { id: 'datos', label: 'Panel' },
  { id: 'metodologia', label: 'Metodología' },
  { id: 'fuentes', label: 'Fuentes de datos' },
]

export function Header({ panel, onPanel }: Props) {
  return (
    <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
      {/* RF-10.3 — atajo de teclado al contenido, antes de la navegación. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-3 focus:py-1.5 focus:rounded"
      >
        Ir al contenido
      </a>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            AR
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-100 leading-none">
              Monitor Estadístico
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Argentina · Indicadores económico-sociales
            </p>
          </div>
        </div>
        {/* RF-9.5 — la sección de fuentes está en la navegación principal. */}
        <nav aria-label="Secciones" className="flex items-center gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onPanel(tab.id)}
              aria-current={panel === tab.id ? 'page' : undefined}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                panel === tab.id
                  ? 'bg-gray-800 text-gray-100 border-gray-600'
                  : 'bg-transparent text-gray-500 border-gray-800 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
