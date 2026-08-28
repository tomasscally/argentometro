import { ALL_SOURCES, type Source, type SourceLevel } from '../data/sources'
import { INDICATORS } from '../data/indicators'

/**
 * §8.11 / RF-9.5 a RF-9.10 — sección de fuentes.
 *
 * Se genera desde el registro de fuentes, no se escribe a mano: no puede
 * desincronizarse del dato que la aplicación efectivamente consulta (RF-9.8).
 */

const LEVEL_LABEL: Record<SourceLevel, string> = {
  primaria: 'Primaria',
  'secundaria-oficial': 'Secundaria oficial',
  agregador: 'Agregador',
  academica: 'Académica',
}

/** Qué indicadores aporta cada fuente, derivado del registro (RF-9.6). */
function indicatorsFor(source: Source): string[] {
  return INDICATORS.filter((i) => i.series.some((s) => s.sourceId === source.id)).map(
    (i) => i.label
  )
}

function seriesIdsFor(source: Source): string[] {
  return INDICATORS.flatMap((i) =>
    i.series.filter((s) => s.sourceId === source.id).map((s) => s.seriesId)
  )
}

export function SourcesPanel() {
  const inUse = ALL_SOURCES.filter((s) => indicatorsFor(s).length > 0)
  const approved = ALL_SOURCES.filter(
    (s) => s.state === 'aprobada' && indicatorsFor(s).length === 0
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-1">Fuentes de datos</h2>
        <p className="text-sm text-gray-400">
          Todos los datos provienen de las fuentes listadas acá. La aplicación no los
          modifica más allá de los cálculos declarados en cada tabla.
        </p>
      </div>

      <div className="card">
        <h3 className="text-xs font-medium text-gray-400 mb-3">En uso</h3>
        <ul className="flex flex-col divide-y divide-gray-800 list-none p-0 m-0">
          {inUse.map((source) => (
            <li key={source.id} className="py-3 first:pt-0 last:pb-0">
              <SourceEntry source={source} />
            </li>
          ))}
        </ul>
      </div>

      {approved.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-medium text-gray-400 mb-3">
            Aprobadas, todavía sin indicadores en la aplicación
          </h3>
          <ul className="flex flex-col divide-y divide-gray-800 list-none p-0 m-0">
            {approved.map((source) => (
              <li key={source.id} className="py-3 first:pt-0 last:pb-0">
                <SourceEntry source={source} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function SourceEntry({ source }: { source: Source }) {
  const indicators = indicatorsFor(source)
  const seriesIds = seriesIdsFor(source)

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-gray-200">{source.organismo}</p>
      <p className="text-xs text-gray-500">
        {LEVEL_LABEL[source.level]}
        {' · '}
        {source.access === 'api' ? 'consulta en vivo' : 'copia local con fecha de captura'}
        {indicators.length > 0 && ` · ${indicators.join(', ')}`}
      </p>
      {seriesIds.length > 0 && (
        <p className="text-[11px] text-gray-600 font-mono break-all">
          {seriesIds.join(' · ')}
        </p>
      )}
      {source.notes && <p className="text-[11px] text-gray-600">{source.notes}</p>}
      <p className="text-xs">
        {/* RF-9.6 — enlace directo a la fuente. */}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline break-all"
        >
          {source.url}
        </a>
      </p>
      <p className="text-[10px] text-gray-600">
        Verificada el {source.verifiedOn}
        {source.approvedOn && ` · aprobada el ${source.approvedOn}`}
      </p>
    </div>
  )
}
