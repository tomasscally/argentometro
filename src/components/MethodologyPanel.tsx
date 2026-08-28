import { useEffect, useRef } from 'react'
import { INDICATORS } from '../data/indicators'
import { GLOSSARY, type GlossaryTermId } from '../lib/glossary'
import { GOVERNMENTS } from '../data/governments'
import { SOURCES } from '../data/sources'

/**
 * RF-9.1 — panel de metodología: fórmulas, quiebres declarados y limitaciones,
 * en lenguaje llano. Se arma desde los registros, no se escribe a mano.
 */

const KIND_METHOD: Record<string, { label: string; detail: string }> = {
  'tasa-flujo': {
    label: 'Tasa de flujo',
    detail:
      'Se acumula componiendo las variaciones del período —el producto de (1 + r) menos 1— y ' +
      'se expresa también su equivalente anualizada. No se promedian variaciones mensuales: ' +
      'el promedio de doce meses al 5 % da 5 %, cuando la inflación acumulada real es 79,6 %.',
  },
  nivel: {
    label: 'Nivel o stock',
    detail:
      'Se compara el primer y el último dato disponible del período, punta a punta. Promediar ' +
      'un nivel a lo largo de años no describe nada útil.',
  },
  'tasa-estado': {
    label: 'Tasa de estado',
    detail:
      'Se informa el cambio en puntos porcentuales entre el primer y el último dato, y el ' +
      'promedio simple. Pasar de 5 % a 10 % es un aumento de 5 puntos porcentuales, aunque ' +
      'en términos relativos sea del 100 %: se dice cuál de las dos cosas se está mostrando.',
  },
}

const LIMITS: { id: string; text: string }[] = [
  {
    id: 'L1',
    text:
      'El IPC oficial tiene un hueco entre noviembre de 2015 y abril de 2016. La variación ' +
      'mensual necesita el período anterior para calcularse, así que su primer valor tras la ' +
      'reanudación es mayo de 2016. El hueco se muestra como hueco: no se rellena.',
  },
  {
    id: 'L2',
    text:
      'El IPC entre 2007 y 2015 corresponde al período de intervención del INDEC y difiere ' +
      'marcadamente de las mediciones provinciales del mismo período. La serie oficial se ' +
      'muestra completa y con sus valores publicados; el IPC de San Luis está disponible como ' +
      'serie adicional para compararlas en el mismo panel.',
  },
  {
    id: 'L5',
    text:
      'Pobreza y desempleo salen de la EPH, que cubre 31 aglomerados urbanos y no el total del ' +
      'país. Su frecuencia es semestral y trimestral: no hay dato mensual y no se simula.',
  },
  {
    id: 'L7',
    text:
      'La gestión en curso tiene un período incompleto. Sus métricas acumuladas no son ' +
      'comparables con las de gestiones completas, y la tabla lo indica.',
  },
  {
    id: 'L9',
    text:
      'Los datos se leen de una copia local que se actualiza a diario. La fecha de esa copia ' +
      'se muestra junto a cada indicador.',
  },
  {
    id: 'L12',
    text:
      'Las series de CEDLAS miden con líneas internacionales en dólares de paridad de poder ' +
      'adquisitivo, no con la línea del INDEC. Son indicadores distintos, no dos mediciones ' +
      'del mismo: no se empalman ni se presentan como alternativa uno del otro.',
  },
  {
    id: 'L15',
    text:
      'La comparación entre países es limitada. Aun en una base armonizada, cada país se mide ' +
      'con su propia encuesta de hogares, y esas encuestas cambian con el tiempo dentro de ' +
      'cada país.',
  },
]

interface Props {
  /** Término al que hay que ir, cuando se llega desde una marca de una tabla. */
  target?: GlossaryTermId | null
}

export function MethodologyPanel({ target }: Props) {
  const withBreaks = INDICATORS.filter((i) => i.breaks.length > 0)
  const targetRef = useRef<HTMLLIElement | null>(null)

  // Llevar el foco, no solo el scroll: quien navega con teclado o lector de
  // pantalla también tiene que llegar al término.
  useEffect(() => {
    if (!target) return
    const node = targetRef.current
    if (!node) return
    node.scrollIntoView({ block: 'center', behavior: 'smooth' })
    node.focus({ preventScroll: true })
  }, [target])

  return (
    <section className="flex flex-col gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-1">Metodología</h2>
        <p className="text-sm text-gray-400">
          Cómo se calcula cada número, qué cambió a lo largo de cada serie y qué no
          puede pedírsele a estos datos.
        </p>
      </div>

      <div className="card">
        <h3 id="glosario" className="text-xs font-medium text-gray-400 mb-1">
          Qué significan las marcas de las tablas
        </h3>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          Cada una avisa algo que cambia cómo hay que leer el número que tiene al lado.
        </p>
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {GLOSSARY.map((term) => {
            const isTarget = term.id === target
            return (
              <li
                key={term.id}
                id={`glosario-${term.id}`}
                ref={isTarget ? targetRef : undefined}
                tabIndex={-1}
                className={`rounded-lg px-3 py-2 border transition-colors scroll-mt-24 ${
                  isTarget
                    ? 'border-blue-700 bg-blue-950/40'
                    : 'border-gray-800 bg-gray-900/40'
                }`}
              >
                <p className="text-sm font-medium text-gray-200">{term.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{term.summary}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  {term.detail}
                </p>
                {term.example && (
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    <span className="text-gray-500">Por ejemplo:</span> {term.example}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="card">
        <h3 className="text-xs font-medium text-gray-400 mb-3">
          Cómo se agrega cada tipo de indicador
        </h3>
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {Object.entries(KIND_METHOD).map(([kind, m]) => (
            <li key={kind}>
              <p className="text-sm text-gray-200 font-medium">{m.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{m.detail}</p>
              <p className="text-[11px] text-gray-600 mt-1">
                {INDICATORS.filter((i) => i.kind === kind)
                  .map((i) => i.label)
                  .join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 className="text-xs font-medium text-gray-400 mb-3">
          Cambios de metodología declarados
        </h3>
        <div className="flex flex-col gap-4">
          {withBreaks.map((indicator) => (
            <div key={indicator.id}>
              <p className="text-sm text-gray-200 font-medium flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: indicator.color }}
                />
                {indicator.label}
              </p>
              <ul className="mt-1 flex flex-col gap-1.5 list-none p-0">
                {indicator.breaks.map((b) => (
                  <li key={b.date} className="text-xs">
                    <span className="text-amber-500/80 font-mono">{b.date}</span>{' '}
                    <span className="text-gray-300">{b.short}</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      {b.long}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-xs font-medium text-gray-400 mb-3">
          Qué no puede pedírsele a estos datos
        </h3>
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {LIMITS.map((l) => (
            <li key={l.id} className="text-xs text-gray-400 leading-relaxed">
              <span className="text-gray-600 font-mono mr-1.5">{l.id}</span>
              {l.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 className="text-xs font-medium text-gray-400 mb-3">
          Gestiones y asignación de períodos
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Cada observación se asigna a la gestión en cuya ventana cae su fecha. La
          ventana incluye el día de asunción y excluye el día de asunción del
          sucesor, de modo que ninguna observación se cuente dos veces. El color
          identifica a la fuerza política; no es una valoración.
        </p>
        <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
          {GOVERNMENTS.map((g) => (
            <li
              key={g.id}
              className="text-xs text-gray-400 flex items-center gap-1.5 border border-gray-800 rounded px-2 py-1"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: g.color }}
              />
              {g.name}
              <span className="text-gray-600 font-mono text-[10px]">
                {g.startDate} → {g.endDate ?? 'en curso'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 className="text-xs font-medium text-gray-400 mb-3">Niveles de fuente</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Ante dos fuentes para el mismo dato se usa la de mayor jerarquía. Una fuente
          secundaria, un agregador o una académica solo cubren lo que la primaria no
          publica, y siempre rotuladas. Hoy se consultan{' '}
          {Object.values(SOURCES).filter((s) => s.state === 'aprobada').length} fuentes
          aprobadas.
        </p>
      </div>
    </section>
  )
}
