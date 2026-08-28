import type { Indicator, IndicatorId, SeriesRef } from '../types'
import { EXTRA_INDICATORS } from './indicators.extra'
import { buildColorMap } from '../lib/palette'

/**
 * Registro de indicadores (RF-1.2). Única fuente de verdad sobre series,
 * escalas y quiebres: agregar un indicador no debe requerir tocar la UI (RNF-8).
 *
 * Los `seriesId` fueron verificados contra el dump oficial de metadatos de
 * apis.datos.gob.ar el 2026-08-27.
 */
export const INDICATORS: Indicator[] = [
  {
    id: 'inflation',
    category: 'precios',
    label: 'Inflación (IPC)',
    description: 'Variación mensual del Índice de Precios al Consumidor',
    unit: '% mensual',
    kind: 'tasa-flujo',
    frequency: 'mensual',
    color: '#d94a4a',
    decimals: 1,
    series: [
      // 2003-01 → 2013-12. La fuente ya publica la variación en porcentaje.
      {
        sourceId: 'datos-gob-ar',
        seriesId: '96.3_INGV_2008_M_20',
        validFrom: '2003-01-01',
        validTo: '2014-01-01',
        scale: 1,
      },
      // 2014-01 → 2015-10. IPCNu: se pide la variación del índice, viene como fracción.
      {
        sourceId: 'datos-gob-ar',
        seriesId: '98.3_INNG_2013_0_20',
        validFrom: '2014-01-01',
        validTo: '2015-11-01',
        scale: 100,
        transform: 'percent_change',
      },
      // 2016-05 → 2016-12. IPC-GBA reanudado, hasta que arranca el nacional.
      {
        sourceId: 'datos-gob-ar',
        seriesId: '101.1_I2NG_2016_M_22',
        validFrom: '2016-05-01',
        validTo: '2017-01-01',
        scale: 100,
        transform: 'percent_change',
      },
      // 2017-01 en adelante. IPC nacional, base dic-2016.
      {
        sourceId: 'datos-gob-ar',
        seriesId: '148.3_INIVELNAL_DICI_M_26',
        validFrom: '2017-01-01',
        validTo: null,
        scale: 100,
        transform: 'percent_change',
      },
    ],
    breaks: [
      {
        date: '2007-01-01',
        kind: 'contexto',
        short: 'ene-2007: comienza la intervención del INDEC',
        long:
          'A partir de enero de 2007 el IPC corresponde al período de intervención del INDEC. ' +
          'La serie se muestra completa y con sus valores publicados. Las direcciones provinciales ' +
          'de estadística publicaron mediciones que difieren de la nacional en ese tramo; el IPC de ' +
          'San Luis está disponible como serie adicional para compararlas en el mismo panel.',
      },
      {
        date: '2008-04-01',
        kind: 'base',
        short: 'abr-2008: nueva base IPC-GBA',
        long: 'Cambio de base del IPC-GBA a abril 2008 = 100. Las variaciones porcentuales siguen siendo comparables; los niveles del índice no.',
      },
      {
        date: '2013-12-01',
        kind: 'cobertura',
        short: 'dic-2013: IPCNu, cobertura urbana nacional',
        long: 'Comienza el IPCNu, con cobertura urbana nacional y base octubre 2013. Cambian cobertura y base a la vez.',
      },
      {
        date: '2015-11-01',
        kind: 'interrupcion',
        short: 'nov-2015: se interrumpe la publicación',
        long: 'El INDEC deja de publicar el IPC nacional entre noviembre de 2015 y marzo de 2016. El hueco se muestra como hueco: no se rellena.',
      },
      {
        date: '2016-04-01',
        kind: 'base',
        short: 'abr-2016: vuelve el IPC-GBA',
        long: 'Se reanuda la publicación con el IPC-GBA y una nueva base.',
      },
      {
        date: '2016-12-01',
        kind: 'cobertura',
        short: 'dic-2016: IPC nacional, antes IPC-GBA',
        long:
          'Desde diciembre de 2016 el índice tiene cobertura nacional, con base dic-2016 = 100. ' +
          'Los tramos anteriores corresponden al IPC del Gran Buenos Aires, de cobertura geográfica menor.',
      },
    ],
  },
  {
    id: 'inflation_san_luis',
    category: 'precios',
    label: 'Inflación · San Luis',
    description:
      'Variación mensual del IPC de la provincia de San Luis, publicado por su ' +
      'Dirección Provincial de Estadística y Censos',
    unit: '% mensual',
    kind: 'tasa-flujo',
    frequency: 'mensual',
    color: '#c96fb0',
    decimals: 1,
    // RF-3.51 — serie adicional, nunca sustituto de la nacional.
    alternativeTo: 'inflation',
    originLabel: 'Medición provincial · San Luis',
    series: [
      {
        sourceId: 'datos-gob-ar',
        seriesId: '197.1_NIVEL_GENERAL_2014_0_13',
        validFrom: '2005-10-01',
        validTo: null,
        scale: 100,
        transform: 'percent_change',
      },
    ],
    breaks: [],
  },
  {
    id: 'poverty',
    category: 'ingresos',
    label: 'Pobreza',
    description: 'Porcentaje de personas bajo la línea de pobreza (EPH-INDEC)',
    unit: '% de personas',
    kind: 'tasa-estado',
    frequency: 'semestral',
    color: '#d9822b',
    decimals: 1,
    series: [
      {
        sourceId: 'datos-gob-ar',
        seriesId: '64.2_POBLACION_NUA_0_0_34_74',
        validFrom: '2003-01-01',
        validTo: null,
        // La API devuelve fracción: 0.282 = 28,2 % (RF-1.5).
        scale: 100,
      },
    ],
    breaks: [
      {
        date: '2003-01-01',
        kind: 'metodologia',
        short: '2003: EPH continua, antes EPH puntual',
        long:
          'La serie arranca en 2003 por el pasaje de EPH puntual a EPH continua. No hay comparabilidad ' +
          'estricta con datos previos. Cubre 31 aglomerados urbanos, no el total del país.',
      },
    ],
  },
  {
    id: 'exchange_rate',
    category: 'cambiario',
    label: 'Tipo de cambio',
    description: 'Tipo de cambio de referencia del BCRA, Comunicación A 3500',
    unit: 'ARS / USD',
    kind: 'nivel',
    // La fuente la publica diaria: se respeta esa frecuencia (RF-1.4).
    frequency: 'diaria',
    color: '#2f9e6e',
    decimals: 2,
    series: [
      {
        sourceId: 'datos-gob-ar',
        seriesId: '175.1_DR_REFE500_0_0_25',
        validFrom: '2002-03-01',
        validTo: null,
        scale: 1,
      },
    ],
    breaks: [],
  },
  {
    id: 'unemployment',
    category: 'trabajo',
    label: 'Desempleo',
    description: 'Tasa de desocupación total (EPH-INDEC)',
    unit: '% de la PEA',
    kind: 'tasa-estado',
    frequency: 'trimestral',
    color: '#3d6fb4',
    decimals: 1,
    series: [
      {
        sourceId: 'datos-gob-ar',
        seriesId: '42.3_EPH_PUNTUATAL_0_M_30',
        validFrom: '2003-01-01',
        validTo: null,
        // La API devuelve fracción: 0.078 = 7,8 % (RF-1.5).
        scale: 100,
      },
    ],
    breaks: [
      {
        date: '2003-01-01',
        kind: 'metodologia',
        short: '2003: EPH continua, antes EPH puntual',
        long:
          'La serie arranca en 2003 por el pasaje de EPH puntual a EPH continua. Cubre 31 aglomerados ' +
          'urbanos, no el total del país.',
      },
    ],
  },
  {
    id: 'reserves',
    category: 'cambiario',
    label: 'Reservas del BCRA',
    description: 'Reservas internacionales del Banco Central',
    unit: 'millones de USD',
    kind: 'nivel',
    frequency: 'diaria',
    color: '#4bb3a5',
    decimals: 0,
    series: [
      {
        sourceId: 'bcra',
        seriesId: '1',
        validFrom: '2014-04-25',
        validTo: null,
        scale: 1,
      },
    ],
    breaks: [
      {
        date: '2014-04-25',
        kind: 'metodologia',
        short: 'abr-2014: inicio de la serie diaria del BCRA',
        long:
          'La API del BCRA publica la serie diaria de reservas desde abril de 2014. ' +
          'Para el tramo anterior existe una serie mensual en apis.datos.gob.ar, con ' +
          'otra frecuencia: no se empalman.',
      },
    ],
  },
  {
    id: 'cedlas_gini',
    category: 'ingresos',
    label: 'Desigualdad (Gini) · CEDLAS',
    description:
      'Coeficiente de Gini del ingreso per cápita familiar, calculado por el ' +
      'CEDLAS (UNLP) con el Banco Mundial a partir de microdatos de la EPH',
    unit: 'coeficiente',
    kind: 'tasa-estado',
    // Anual hasta 2003 y semestral desde entonces. Se declara la cadencia más
    // espaciada: con la otra, cada salto anual se leería como un hueco.
    frequency: 'anual',
    color: '#7f9fd6',
    decimals: 3,
    group: 'alternativa',
    // RF-0.10 — fuente académica: serie propia, nunca sustituto de la oficial.
    originLabel: 'CEDLAS / SEDLAC · metodología armonizada regional',
    series: [
      {
        sourceId: 'cedlas',
        seriesId: '2025_Act1_inequality_LAC.xlsx#gini1#Argentina',
        validFrom: '1974-01-01',
        validTo: null,
        scale: 1,
      },
    ],
    breaks: [
      {
        date: '1992-01-01',
        kind: 'cobertura',
        short: '1992: de Gran Buenos Aires a 15 ciudades',
        long: 'La cobertura geográfica de la serie pasa del Gran Buenos Aires a las 15 principales ciudades.',
      },
      {
        date: '1998-01-01',
        kind: 'cobertura',
        short: '1998: de 15 a 28 ciudades',
        long: 'La cobertura pasa de 15 a 28 principales ciudades.',
      },
      {
        date: '2003-07-01',
        kind: 'cobertura',
        short: '2003: EPH continua, 31 aglomerados',
        long:
          'Pasa a EPH continua con 31 aglomerados y la frecuencia deja de ser anual ' +
          'para volverse semestral.',
      },
    ],
  },
  {
    id: 'cedlas_poverty_215',
    category: 'ingresos',
    label: 'Pobreza extrema USD 2,15 · CEDLAS',
    description:
      'Porcentaje de personas bajo la línea internacional de USD 2,15 por día ' +
      'en paridad de poder adquisitivo, calculado por el CEDLAS',
    unit: '% de personas',
    kind: 'tasa-estado',
    // Anual hasta 2003 y semestral desde entonces, como el Gini de CEDLAS.
    frequency: 'anual',
    color: '#cf8f6f',
    decimals: 1,
    group: 'alternativa',
    // L12 — no es la pobreza del INDEC: mide con línea internacional.
    originLabel: 'CEDLAS / SEDLAC · línea internacional USD PPP, no la del INDEC',
    series: [
      {
        sourceId: 'cedlas',
        seriesId: '2024_Act1_poverty_LAC.xlsx#poverty USD2.15#Argentina',
        validFrom: '1986-01-01',
        validTo: null,
        scale: 1,
      },
    ],
    breaks: [],
  },
]

/**
 * §8.5 — comparación internacional. El mismo concepto medido en otros países,
 * con series armonizadas del Banco Mundial (RF-3.42). La advertencia
 * metodológica de RF-3.41 corre por cuenta de la interfaz.
 */
const COUNTRIES: { code: string; label: string }[] = [
  { code: 'BRA', label: 'Brasil' },
  { code: 'CHL', label: 'Chile' },
  { code: 'URY', label: 'Uruguay' },
  { code: 'MEX', label: 'México' },
]

const WB_INDICATORS: {
  key: string
  code: string
  label: string
  unit: string
  color: string
  decimals: number
  /** Países omitidos porque la fuente no publica la serie para ellos. */
  omit?: string[]
}[] = [
  {
    key: 'gini',
    code: 'SI.POV.GINI',
    label: 'Desigualdad (Gini)',
    unit: 'coeficiente',
    color: '#8f7fd4',
    decimals: 3,
  },
  {
    key: 'poverty',
    code: 'SI.POV.NAHC',
    label: 'Pobreza (línea nacional)',
    unit: '% de personas',
    color: '#c2703f',
    decimals: 1,
    // El Banco Mundial no publica pobreza por línea nacional para Brasil.
    // Se omite en lugar de dejar un indicador que siempre falla.
    omit: ['BRA'],
  },
  {
    key: 'gdppc',
    code: 'NY.GDP.PCAP.KD',
    label: 'PBI per cápita',
    unit: 'USD constantes de 2015',
    color: '#5f9fb8',
    decimals: 0,
  },
  {
    key: 'cpi',
    code: 'FP.CPI.TOTL.ZG',
    label: 'Inflación anual',
    unit: '% anual',
    color: '#c45f5f',
    decimals: 1,
  },
  {
    key: 'unemp',
    code: 'SL.UEM.TOTL.ZS',
    label: 'Desempleo (OIT)',
    unit: '% de la PEA',
    color: '#7f8fc4',
    decimals: 1,
  },
]

function wbSeries(code: string, country: string): SeriesRef[] {
  return [
    {
      sourceId: 'world-bank',
      seriesId: code,
      country,
      validFrom: '1980-01-01',
      validTo: null,
      scale: 1,
    },
  ]
}

const INTERNATIONAL: Indicator[] = WB_INDICATORS.flatMap((wb) =>
  [{ code: 'ARG', label: 'Argentina' }, ...COUNTRIES]
    .filter((c) => !wb.omit?.includes(c.code))
    .map((c, index) => ({
      id: `wb_${wb.key}_${c.code.toLowerCase()}` as IndicatorId,
      label: `${wb.label} · ${c.label}`,
      description: `${wb.label} en ${c.label}, serie anual del Banco Mundial`,
      unit: wb.unit,
      kind: 'tasa-estado' as const,
      // Las encuestas de hogares no se relevan todos los años en todos los
      // países: el espacio entre puntos es la cadencia, no un hueco (L15).
      frequency: 'irregular' as const,
      // Tonos de la misma familia por indicador, uno por país.
      color: shiftColor(wb.color, index),
      decimals: wb.decimals,
      category: 'internacional' as const,
      group: 'internacional' as const,
      countryLabel: c.label,
      originLabel: `Banco Mundial · ${c.label}`,
      series: wbSeries(wb.code, c.code),
      breaks: [],
    }))
)

/** Aclara u oscurece un color para distinguir países dentro de un indicador. */
function shiftColor(hex: string, step: number): string {
  const amount = (step - 2) * 22
  const channels = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) + amount
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

INDICATORS.push(...EXTRA_INDICATORS, ...INTERNATIONAL)

/*
 * El color de cada serie se asigna acá, no en la declaración de cada indicador:
 * con 77 indicadores elegirlos a mano produce curvas casi indistinguibles en el
 * mismo panel. La asignación es estable por indicador —sumar o quitar series no
 * repinta las demás— y no repite tono dentro de una categoría.
 */
const COLORS = buildColorMap(INDICATORS)
for (const indicator of INDICATORS) {
  indicator.color = COLORS.get(indicator.id) ?? indicator.color
}

export const INDICATOR_BY_ID: Record<IndicatorId, Indicator> = Object.fromEntries(
  INDICATORS.map((i) => [i.id, i])
) as Record<IndicatorId, Indicator>

export function getIndicator(id: IndicatorId): Indicator {
  const indicator = INDICATOR_BY_ID[id]
  if (!indicator) throw new Error(`Indicador desconocido: ${id}`)
  return indicator
}
