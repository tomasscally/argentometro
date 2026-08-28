/**
 * Registro de fuentes de datos (§4 del documento de requerimientos).
 *
 * Única fuente de verdad sobre qué hosts puede consultar la aplicación.
 * El control es mecánico: `assertSourceApproved` rechaza cualquier fuente que
 * no esté en estado 'aprobada', y un test verifica que ningún indicador
 * referencie una fuente no aprobada (RF-0.2, RNF-6).
 */

export type SourceState = 'aprobada' | 'propuesta' | 'rechazada'

/** §4.3 — niveles de fuente. Determinan la jerarquía de RF-0.5 y P6. */
export type SourceLevel =
  | 'primaria'
  | 'secundaria-oficial'
  | 'agregador'
  | 'academica'

export type SourceId =
  | 'datos-gob-ar'
  | 'bcra'
  | 'argentinadatos'
  | 'world-bank'
  | 'indec'
  | 'finanzas'
  | 'estadistica-caba'
  | 'cedlas'

export interface Source {
  id: SourceId
  /** Organismo responsable del dato. */
  organismo: string
  /** Host desde el que se consulta. Vacío si el acceso es por snapshot. */
  host: string
  level: SourceLevel
  state: SourceState
  /** Fecha de aprobación, ISO. Null si no está aprobada. */
  approvedOn: string | null
  /** true si el host envía cabeceras CORS y puede consultarse desde el navegador. */
  cors: boolean
  /** Cómo se accede: en vivo desde el navegador, o por snapshot commiteado (RF-0.6). */
  access: 'api' | 'snapshot'
  /** Enlace público para la sección de fuentes (RF-9.5, RF-9.6). */
  url: string
  /** Fecha de la última verificación técnica, ISO. */
  verifiedOn: string
  notes?: string
}

export const SOURCES: Record<SourceId, Source> = {
  'datos-gob-ar': {
    id: 'datos-gob-ar',
    organismo: 'Series de Tiempo AR — Ministerio de Economía',
    host: 'apis.datos.gob.ar',
    level: 'secundaria-oficial',
    state: 'aprobada',
    approvedOn: '2026-08-27',
    cors: true,
    access: 'api',
    url: 'https://datosgobar.github.io/series-tiempo-ar-api/',
    verifiedOn: '2026-08-27',
  },
  bcra: {
    id: 'bcra',
    organismo: 'Banco Central de la República Argentina',
    host: 'api.bcra.gob.ar',
    level: 'primaria',
    state: 'aprobada',
    approvedOn: '2026-08-27',
    cors: true,
    access: 'api',
    url: 'https://www.bcra.gob.ar/BCRAyVos/catalogo-de-APIs-banco-central.asp',
    verifiedOn: '2026-08-27',
    notes: 'v4.0. La v3.0 devuelve HTTP 410.',
  },
  argentinadatos: {
    id: 'argentinadatos',
    organismo: 'ArgentinaDatos (redistribuye el EMBI+ de J.P. Morgan)',
    host: 'api.argentinadatos.com',
    level: 'agregador',
    state: 'aprobada',
    approvedOn: '2026-08-27',
    cors: true,
    access: 'api',
    url: 'https://argentinadatos.com/',
    verifiedOn: '2026-08-27',
    notes: 'Rotular siempre emisor y vía (RF-9.4). Sin SLA.',
  },
  'world-bank': {
    id: 'world-bank',
    organismo: 'World Bank Open Data',
    host: 'api.worldbank.org',
    level: 'secundaria-oficial',
    state: 'aprobada',
    approvedOn: '2026-08-27',
    cors: true,
    access: 'api',
    url: 'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589',
    verifiedOn: '2026-08-27',
  },
  cedlas: {
    id: 'cedlas',
    organismo: 'CEDLAS — UNLP y Banco Mundial (SEDLAC)',
    host: '',
    level: 'academica',
    state: 'aprobada',
    approvedOn: '2026-08-27',
    cors: false,
    access: 'snapshot',
    url: 'https://www.cedlas.econo.unlp.edu.ar/wp/en/estadisticas/sedlac/estadisticas/',
    verifiedOn: '2026-08-27',
    notes: 'Mide con líneas internacionales USD PPP. No se empalma con series oficiales (RF-0.10).',
  },
  indec: {
    id: 'indec',
    organismo: 'Instituto Nacional de Estadística y Censos',
    host: '',
    level: 'primaria',
    state: 'aprobada',
    approvedOn: '2026-08-27',
    cors: false,
    access: 'snapshot',
    url: 'https://www.indec.gob.ar/',
    verifiedOn: '2026-08-27',
    notes: 'URL de descarga sin resolver (§4.6). Hace soft-404: valida contenido (RF-0.8).',
  },
  finanzas: {
    id: 'finanzas',
    organismo: 'Secretaría de Finanzas — Ministerio de Economía',
    host: '',
    level: 'primaria',
    state: 'aprobada',
    approvedOn: '2026-08-27',
    cors: false,
    access: 'snapshot',
    url: 'https://www.argentina.gob.ar/economia/finanzas',
    verifiedOn: '2026-08-27',
    notes: 'URL de descarga sin resolver (§4.6). Publica desde planilla embebida.',
  },
  'estadistica-caba': {
    id: 'estadistica-caba',
    organismo: 'Instituto de Estadística y Censos — Ciudad de Buenos Aires',
    host: '',
    level: 'primaria',
    state: 'aprobada',
    approvedOn: '2026-08-27',
    cors: false,
    access: 'snapshot',
    url: 'https://www.estadisticaciudad.gob.ar/',
    verifiedOn: '2026-08-27',
    notes: 'URL de descarga sin resolver (§4.6).',
  },
}

export const ALL_SOURCES: Source[] = Object.values(SOURCES)

/** Hosts que la aplicación tiene permitido consultar en vivo. */
export const APPROVED_HOSTS: string[] = ALL_SOURCES.filter(
  (s) => s.state === 'aprobada' && s.access === 'api' && s.host !== ''
).map((s) => s.host)

export class UnapprovedSourceError extends Error {
  constructor(readonly sourceId: string, readonly reason: string) {
    super(`Fuente no habilitada: ${sourceId} — ${reason}`)
    this.name = 'UnapprovedSourceError'
  }
}

/**
 * RF-0.2 — control mecánico. Toda consulta pasa por acá antes de salir a la red.
 * Lanza en lugar de degradar: nunca hay fallback silencioso (P4).
 */
export function assertSourceApproved(id: SourceId): Source {
  const source = SOURCES[id]
  if (!source) throw new UnapprovedSourceError(id, 'no está en el registro de fuentes')
  if (source.state !== 'aprobada') {
    throw new UnapprovedSourceError(id, `su estado es "${source.state}"`)
  }
  return source
}

/** Verifica que una URL apunte a un host aprobado antes de hacer fetch. */
export function assertHostApproved(url: string): void {
  let host: string
  try {
    host = new URL(url).host
  } catch {
    throw new UnapprovedSourceError(url, 'no es una URL válida')
  }
  if (!APPROVED_HOSTS.includes(host)) {
    throw new UnapprovedSourceError(host, 'el host no pertenece a ninguna fuente aprobada con acceso por API')
  }
}
