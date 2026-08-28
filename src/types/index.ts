import type { SourceId } from '../data/sources'

export type { SourceId }

export interface DataPoint {
  /** ISO date, YYYY-MM-DD. Para períodos, la fecha de inicio del período. */
  date: string
  value: number
}

/** Agrupación temática, para ordenar el selector (§8.4). */
export type Category =
  | 'precios'
  | 'cambiario'
  | 'actividad'
  | 'trabajo'
  | 'ingresos'
  | 'fiscal'
  | 'social'
  | 'internacional'

/**
 * Un indicador derivado de otros dos. Se calcula al tomar la copia local, no en
 * el navegador, y queda marcado como calculado en la interfaz (§5.3).
 */
export interface ComputedSpec {
  /**
   * `deflactar`: divide el primero por un índice de precios construido a partir
   * de las variaciones mensuales del segundo, y lo expresa en base 100.
   * `brecha`: diferencia porcentual del primero sobre el segundo.
   */
  op: 'deflactar' | 'brecha'
  inputs: [IndicatorId, IndicatorId]
}

export type IndicatorId =
  | 'inflation'
  | 'inflation_san_luis'
  | 'poverty'
  | 'exchange_rate'
  | 'unemployment'
  | 'reserves'
  | 'country_risk'
  | 'cedlas_gini'
  | 'cedlas_poverty_215'
  | 'inflation_core'
  | 'inflation_regulated'
  | 'inflation_1943'
  | 'basket_total'
  | 'emae'
  | 'emae_yoy'
  | 'construction'
  | 'exports'
  | 'imports'
  | 'tax_revenue'
  | 'ripte'
  | 'real_wage'
  | 'real_wage_sl'
  | 'wage_index'
  | 'registered_employment'
  | 'gini_official'
  | 'usd_blue'
  | 'usd_official'
  | 'usd_ccl'
  | 'usd_mep'
  | 'usd_card'
  | 'usd_gap'
  | 'rate_fixed_term'
  | 'rate_badlar'
  | 'uva'
  | 'cer'
  | 'monetary_base'
  | 'private_credit'
  /** Series de CEDLAS: `cedlas_<tema>`. */
  | `cedlas_${string}`
  /** Series del Banco Mundial: `wb_<indicador>_<país>`. */
  | `wb_${string}`

/**
 * §7.1 — el tipo determina qué métricas agregadas son válidas.
 * Calcular una métrica fuera de las válidas para el tipo está prohibido (P5).
 */
export type IndicatorKind = 'tasa-flujo' | 'nivel' | 'tasa-estado'

export type Frequency =
  | 'diaria'
  | 'mensual'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  /**
   * Series basadas en encuestas que no se relevan todos los años, como el Gini
   * de Chile: el espacio entre observaciones es la cadencia del relevamiento,
   * no un dato faltante.
   */
  | 'irregular'

/** §8.3 — quiebres declarados como datos, no hardcodeados en el gráfico (RF-3.20). */
export type BreakKind = 'base' | 'cobertura' | 'organismo' | 'metodologia' | 'interrupcion' | 'contexto'

export interface MethodologyBreak {
  /** Fecha exacta del cambio, YYYY-MM-DD. */
  date: string
  kind: BreakKind
  /** Texto corto, para la marca sobre el gráfico (RF-3.22). */
  short: string
  /** Texto largo, para el panel de metodología. */
  long: string
}

/** Una serie concreta de una fuente, con su rango de validez dentro del indicador. */
export interface SeriesRef {
  sourceId: SourceId
  /** Identificador en la fuente: serie_id, idVariable, código, etc. */
  seriesId: string
  /** Desde cuándo esta serie es la válida para el indicador, YYYY-MM-DD. */
  validFrom: string
  /** Hasta cuándo, exclusivo. null = sin límite. */
  validTo: string | null
  /**
   * Factor de escala aplicado en la ingesta (RF-1.5).
   * La API devuelve tasas como fracción: 0.282 = 28,2 % → scale 100.
   */
  scale: number
  /**
   * Transformación que aplica la propia fuente antes de devolver el dato.
   * 'percent_change' convierte un índice en su variación respecto al período
   * anterior, y la devuelve como fracción (de ahí scale 100).
   */
  transform?: 'percent_change'
  /** Código ISO-3 del país, para fuentes multipaís como el Banco Mundial. */
  country?: string
}

export interface Indicator {
  id: IndicatorId
  label: string
  description: string
  /** Unidad de presentación, ya escalada. */
  unit: string
  kind: IndicatorKind
  frequency: Frequency
  color: string
  category: Category
  /** Series que lo componen, en orden cronológico de validez. */
  series: SeriesRef[]
  /** Presente si el indicador se calcula a partir de otros (§5.3). */
  computed?: ComputedSpec
  breaks: MethodologyBreak[]
  /** Cantidad de decimales al formatear (RF-10.5). */
  decimals: number
  /**
   * RF-3.51 — una medición alternativa a la oficial, disponible como serie
   * adicional seleccionable. Nunca sustituye ni se empalma con la oficial
   * (RF-3.50, RF-3.52); se rotula con su origen y queda fuera de las tablas
   * comparativas oficiales.
   */
  alternativeTo?: IndicatorId
  /** Rótulo de origen, obligatorio cuando el indicador es una alternativa. */
  originLabel?: string
  /**
   * Agrupación en la interfaz. 'internacional' son series del mismo concepto
   * medidas en otro país, sujetas a la advertencia metodológica de §8.5.
   */
  group?: 'oficial' | 'alternativa' | 'internacional'
  /** Nombre del país, cuando el indicador corresponde a otro país. */
  countryLabel?: string
}

export interface Government {
  id: string
  name: string
  /** Nombre corto para la banda del gráfico. */
  shortName: string
  party: string
  /** Fecha de asunción, YYYY-MM-DD. Inicio inclusivo. */
  startDate: string
  /** Asunción del sucesor, YYYY-MM-DD. Fin exclusivo. null = en curso. */
  endDate: string | null
  /** Color de la fuerza política (RF-6.9 a RF-6.12). */
  color: string
}

export interface DateRange {
  /** YYYY-MM-DD, inclusivo. */
  start: string
  /** YYYY-MM-DD, inclusivo (RF-4.2). */
  end: string
}

/** De dónde salió la serie que se está mostrando. Nunca hay datos inventados. */
export type DataOrigin = 'api' | 'snapshot' | 'admin'

export interface SeriesResult {
  points: DataPoint[]
  origin: DataOrigin
  /** Fuentes efectivamente usadas, para la trazabilidad de P1. */
  sourceIds: SourceId[]
  /** Fecha del último dato disponible, YYYY-MM-DD (L8, RF-2.4). */
  lastUpdated: string | null
  /** Momento en que se consultó la fuente para producir la copia local, ISO. */
  fetchedAt: string
  /** Procedencia de cada serie que compone el indicador (RF-0.9, P1). */
  provenance: { seriesId: string; sourceId: SourceId; url: string; rows: number }[]
}
