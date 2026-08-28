import type { Indicator, IndicatorId, SeriesRef } from '../types'

/**
 * Indicadores incorporados después del catálogo inicial.
 *
 * Viven en un archivo aparte para que `indicators.ts` siga siendo legible: son
 * declaraciones, no lógica, y crecen con cada fuente que se aprueba.
 * Todos los `serie_id` fueron verificados contra su fuente el 2026-08-28.
 */

const dg = (
  seriesId: string,
  validFrom: string,
  scale = 1,
  transform?: 'percent_change'
): SeriesRef[] => [
  { sourceId: 'datos-gob-ar', seriesId, validFrom, validTo: null, scale, transform },
]

const bcra = (id: string, validFrom: string): SeriesRef[] => [
  { sourceId: 'bcra', seriesId: id, validFrom, validTo: null, scale: 1 },
]

const cedlas = (file: string, sheet: string, validFrom: string): SeriesRef[] => [
  {
    sourceId: 'cedlas',
    seriesId: `${file}#${sheet}#Argentina`,
    validFrom,
    validTo: null,
    scale: 1,
  },
]

const EMPLOYMENT = '2025_Act1_employment_LAC.xlsx'
const WAGES = '2025_Act1_wages_hours_LAC.xlsx'

// ── Precios ──────────────────────────────────────────────────────────────────

const PRECIOS: Indicator[] = [
  {
    id: 'inflation_core',
    label: 'Inflación núcleo',
    description:
      'Variación mensual del IPC núcleo, que excluye regulados y estacionales: ' +
      'es la medida de la inflación de fondo',
    unit: '% mensual',
    kind: 'tasa-flujo',
    category: 'precios',
    frequency: 'mensual',
    color: '#e07b6a',
    decimals: 1,
    series: dg('148.3_INUCLEONAL_DICI_M_19', '2017-01-01', 100, 'percent_change'),
    breaks: [],
  },
  {
    id: 'inflation_regulated',
    label: 'Inflación de regulados',
    description:
      'Variación mensual del IPC de precios regulados: tarifas, transporte, ' +
      'combustibles y otros bienes con precio administrado',
    unit: '% mensual',
    kind: 'tasa-flujo',
    category: 'precios',
    frequency: 'mensual',
    color: '#c96a4a',
    decimals: 1,
    series: dg('148.3_IREGULANAL_DICI_M_22', '2017-01-01', 100, 'percent_change'),
    breaks: [],
  },
  {
    id: 'basket_total',
    label: 'Canasta básica total',
    description:
      'Costo mensual de la canasta básica total por adulto equivalente: el ' +
      'umbral de la línea de pobreza',
    unit: 'pesos',
    kind: 'nivel',
    category: 'precios',
    frequency: 'mensual',
    color: '#d9a441',
    decimals: 0,
    series: dg('150.1_CSTA_BATAL_0_D_20', '2016-04-01'),
    breaks: [],
  },
]

// ── Cambiario y financiero ───────────────────────────────────────────────────

const CAMBIARIO: Indicator[] = [
  {
    id: 'rate_fixed_term',
    label: 'Tasa de plazo fijo',
    description: 'Tasa de interés de los depósitos a 30 días en entidades financieras',
    unit: '% nominal anual',
    kind: 'tasa-estado',
    category: 'cambiario',
    frequency: 'diaria',
    color: '#5fb39a',
    decimals: 2,
    series: bcra('12', '2015-01-01'),
    breaks: [],
  },
  {
    id: 'rate_badlar',
    label: 'Tasa BADLAR',
    description: 'Tasa de interés de depósitos mayores a un millón de pesos en bancos privados',
    unit: '% nominal anual',
    kind: 'tasa-estado',
    category: 'cambiario',
    frequency: 'diaria',
    color: '#4a9c85',
    decimals: 2,
    series: bcra('7', '2015-01-01'),
    breaks: [],
  },
  {
    id: 'uva',
    label: 'Unidad de valor adquisitivo (UVA)',
    description:
      'Unidad que ajusta por inflación, referencia de los créditos hipotecarios ' +
      'y de los plazos fijos indexados',
    unit: 'pesos',
    kind: 'nivel',
    category: 'cambiario',
    frequency: 'diaria',
    color: '#8f7fd4',
    decimals: 2,
    series: bcra('31', '2016-03-31'),
    breaks: [],
  },
  {
    id: 'cer',
    label: 'Coeficiente de estabilización (CER)',
    description: 'Coeficiente que ajusta por inflación, base 2 de febrero de 2002 = 1',
    unit: 'índice',
    kind: 'nivel',
    category: 'cambiario',
    frequency: 'diaria',
    color: '#a08fd9',
    decimals: 2,
    series: bcra('30', '2015-01-01'),
    breaks: [],
  },
  {
    id: 'monetary_base',
    label: 'Base monetaria',
    description: 'Circulación monetaria más depósitos de las entidades en el Banco Central',
    unit: 'millones de ARS',
    kind: 'nivel',
    category: 'cambiario',
    frequency: 'diaria',
    color: '#c98f5f',
    decimals: 0,
    series: bcra('15', '2015-01-01'),
    breaks: [],
  },
  {
    id: 'private_credit',
    label: 'Crédito al sector privado',
    description: 'Préstamos de las entidades financieras al sector privado',
    unit: 'millones de ARS',
    kind: 'nivel',
    category: 'cambiario',
    frequency: 'diaria',
    color: '#b57f4f',
    decimals: 0,
    series: bcra('26', '2015-01-01'),
    breaks: [],
  },
]

// ── Actividad ────────────────────────────────────────────────────────────────

const ACTIVIDAD: Indicator[] = [
  {
    id: 'emae',
    label: 'Actividad económica (EMAE)',
    description:
      'Estimador mensual de actividad económica, el indicador que anticipa la ' +
      'evolución del producto',
    unit: 'índice 2004=100',
    kind: 'nivel',
    category: 'actividad',
    frequency: 'mensual',
    color: '#5fa8b8',
    decimals: 1,
    series: dg('143.3_NO_PR_2004_A_21', '2004-01-01'),
    breaks: [
      {
        date: '2004-01-01',
        kind: 'base',
        short: 'base 2004 = 100',
        long: 'El índice tiene base 2004 = 100: los niveles se leen respecto de ese año.',
      },
    ],
  },
  {
    id: 'emae_yoy',
    label: 'Actividad · variación interanual',
    description: 'Variación del EMAE respecto del mismo mes del año anterior',
    unit: '% interanual',
    kind: 'tasa-estado',
    category: 'actividad',
    frequency: 'mensual',
    color: '#4a8f9e',
    decimals: 1,
    series: dg('143.3_ICE_SERVIA_2004_A_25', '2005-01-01', 100),
    breaks: [],
  },
  {
    id: 'construction',
    label: 'Construcción (ISAC)',
    description: 'Indicador sintético de la actividad de la construcción',
    unit: 'índice 2004=100',
    kind: 'nivel',
    category: 'actividad',
    frequency: 'mensual',
    color: '#c2a15f',
    decimals: 1,
    series: dg('33.2_ISAC_NIVELRAL_0_M_18_63', '2012-01-01'),
    breaks: [],
  },
  {
    id: 'exports',
    label: 'Exportaciones',
    description: 'Exportaciones totales de bienes',
    unit: 'millones de USD',
    kind: 'nivel',
    category: 'actividad',
    frequency: 'mensual',
    color: '#5fa86f',
    decimals: 0,
    series: dg('74.3_IET_0_M_16', '1992-01-01'),
    breaks: [],
  },
  {
    id: 'imports',
    label: 'Importaciones',
    description: 'Importaciones totales de bienes',
    unit: 'millones de USD',
    kind: 'nivel',
    category: 'actividad',
    frequency: 'mensual',
    color: '#a8635f',
    decimals: 0,
    series: dg('74.3_IIT_0_M_25', '1992-01-01'),
    breaks: [],
  },
]

// ── Fiscal ───────────────────────────────────────────────────────────────────

const FISCAL: Indicator[] = [
  {
    id: 'tax_revenue',
    label: 'Recaudación tributaria',
    description: 'Total de recursos tributarios nacionales recaudados en el mes',
    unit: 'millones de ARS',
    kind: 'nivel',
    category: 'fiscal',
    frequency: 'mensual',
    color: '#9e8f5f',
    decimals: 0,
    series: dg('142.3_TOTAL_2001_M_26', '1997-01-01'),
    breaks: [],
  },
]

// ── Trabajo e ingresos ───────────────────────────────────────────────────────

const TRABAJO: Indicator[] = [
  {
    id: 'ripte',
    label: 'Salario registrado (RIPTE)',
    description:
      'Remuneración imponible promedio de los trabajadores estables, en pesos ' +
      'corrientes',
    unit: 'pesos',
    kind: 'nivel',
    category: 'trabajo',
    frequency: 'mensual',
    color: '#7f9fd6',
    decimals: 0,
    series: dg('158.1_REPTE_0_0_5', '1994-07-01'),
    breaks: [],
  },
  {
    id: 'real_wage',
    label: 'Salario real',
    description:
      'Salario registrado descontada la inflación, en base 100 al inicio de la ' +
      'serie. Calculado por la aplicación a partir del RIPTE y del IPC',
    unit: 'índice base 100',
    kind: 'nivel',
    category: 'trabajo',
    frequency: 'mensual',
    color: '#6f8fc6',
    decimals: 1,
    // §5.3 — derivado: RIPTE deflactado por el IPC.
    computed: { op: 'deflactar', inputs: ['ripte', 'inflation'] },
    series: [],
    // El salario real hereda las advertencias del deflactor. Es la consecuencia
    // más fuerte de L2: si el IPC de un tramo subestima la inflación, el salario
    // real de ese tramo queda sobrestimado.
    breaks: [
      {
        date: '2007-01-01',
        kind: 'contexto',
        short: 'ene-2007: el deflactor entra en el período de intervención',
        long:
          'De 2007 a 2015 el salario real se calcula deflactando por el IPC del período ' +
          'de intervención del INDEC, que difiere marcadamente de las mediciones ' +
          'provinciales del mismo período. Un deflactor más bajo produce un salario real ' +
          'más alto: el crecimiento que muestra la serie en ese tramo depende de esa ' +
          'diferencia. La variante deflactada por el IPC de San Luis permite compararlo ' +
          'en el mismo panel.',
      },
      {
        date: '2016-12-01',
        kind: 'cobertura',
        short: 'dic-2016: el deflactor pasa a ser el IPC nacional',
        long: 'Desde diciembre de 2016 el deflactor es el IPC nacional, de cobertura completa.',
      },
    ],
  },
  {
    id: 'real_wage_sl',
    label: 'Salario real · deflactado por San Luis',
    description:
      'Salario registrado descontada la inflación medida por la provincia de ' +
      'San Luis, cuya serie no se interrumpe ni cambia de metodología entre ' +
      '2005 y hoy. Calculado por la aplicación',
    unit: 'índice base 100',
    kind: 'nivel',
    category: 'trabajo',
    frequency: 'mensual',
    color: '#c96fb0',
    decimals: 1,
    group: 'alternativa',
    originLabel: 'RIPTE deflactado por el IPC de San Luis, no por el nacional',
    computed: { op: 'deflactar', inputs: ['ripte', 'inflation_san_luis'] },
    series: [],
    breaks: [],
  },
  {
    id: 'wage_index',
    label: 'Índice de salarios registrados',
    description: 'Índice de salarios del empleo registrado del sector privado',
    unit: 'índice',
    kind: 'nivel',
    category: 'trabajo',
    frequency: 'mensual',
    color: '#8fa6c9',
    decimals: 1,
    series: dg('149.1_SOR_PRIADO_OCTU_0_25', '2015-10-01'),
    breaks: [],
  },
  {
    id: 'registered_employment',
    label: 'Empleo registrado privado',
    description: 'Puestos de trabajo registrados en el sector privado',
    unit: 'puestos',
    kind: 'nivel',
    category: 'trabajo',
    frequency: 'trimestral',
    color: '#6fb39a',
    decimals: 0,
    series: dg('155.1_TLTAL_C_0_0_5', '1996-01-01'),
    breaks: [],
  },
]

const INGRESOS: Indicator[] = [
  {
    id: 'gini_official',
    label: 'Desigualdad (Gini) · INDEC',
    description: 'Coeficiente de Gini del ingreso per cápita familiar, serie oficial',
    unit: 'coeficiente',
    kind: 'tasa-estado',
    category: 'ingresos',
    frequency: 'trimestral',
    color: '#a88fd4',
    decimals: 3,
    series: dg('65.1_CGI_0_0_21', '2003-07-01'),
    breaks: [],
  },
]

// ── CEDLAS ───────────────────────────────────────────────────────────────────

interface CedlasSpec {
  id: string
  label: string
  description: string
  unit: string
  file: string
  sheet: string
  from: string
  color: string
  decimals: number
  category: Indicator['category']
}

const CEDLAS_SPECS: CedlasSpec[] = [
  {
    id: 'cedlas_informality',
    label: 'Informalidad laboral · CEDLAS',
    description: 'Proporción de asalariados sin aportes jubilatorios',
    unit: '% de asalariados',
    file: EMPLOYMENT, sheet: 'informal_1', from: '1988-01-01',
    color: '#d47f6a', decimals: 1, category: 'trabajo',
  },
  {
    id: 'cedlas_unemployment',
    label: 'Desempleo · CEDLAS',
    description: 'Tasa de desocupación calculada con metodología armonizada regional',
    unit: '% de la PEA',
    file: EMPLOYMENT, sheet: 'unemployment', from: '1986-01-01',
    color: '#6f8fbf', decimals: 1, category: 'trabajo',
  },
  {
    id: 'cedlas_labor_force',
    label: 'Población activa · CEDLAS',
    description: 'Tasa de participación en el mercado de trabajo',
    unit: '% de la población',
    file: EMPLOYMENT, sheet: 'labor force', from: '1986-01-01',
    color: '#5f9f8f', decimals: 1, category: 'trabajo',
  },
  {
    id: 'cedlas_wages',
    label: 'Salario horario · CEDLAS',
    description: 'Salario horario promedio de los ocupados',
    unit: 'índice',
    file: WAGES, sheet: 'wage_1', from: '1986-01-01',
    color: '#8f9fd4', decimals: 2, category: 'trabajo',
  },
  {
    id: 'cedlas_hours',
    label: 'Horas trabajadas · CEDLAS',
    description: 'Horas semanales trabajadas en promedio por los ocupados',
    unit: 'horas semanales',
    file: WAGES, sheet: 'hours_1', from: '1986-01-01',
    color: '#a89f7f', decimals: 1, category: 'trabajo',
  },
  {
    id: 'cedlas_pensions',
    label: 'Cobertura jubilatoria · CEDLAS',
    description: 'Proporción de ocupados con aportes al sistema de jubilaciones',
    unit: '% de ocupados',
    file: '2025_Act1_labor_benefits_LAC.xlsx', sheet: 'pensions', from: '1986-01-01',
    color: '#7fa8b8', decimals: 1, category: 'social',
  },
  {
    id: 'cedlas_health',
    label: 'Cobertura de salud · CEDLAS',
    description: 'Proporción de ocupados con cobertura de salud',
    unit: '% de ocupados',
    file: '2025_Act1_labor_benefits_LAC.xlsx', sheet: 'health', from: '1986-01-01',
    color: '#6f9fa8', decimals: 1, category: 'social',
  },
  {
    id: 'cedlas_household_size',
    label: 'Tamaño del hogar · CEDLAS',
    description: 'Cantidad promedio de integrantes por hogar',
    unit: 'personas',
    file: '2025_Act1_demographics_LAC.xlsx', sheet: 'hh size', from: '1974-01-01',
    color: '#b89f8f', decimals: 2, category: 'social',
  },
  {
    id: 'cedlas_dependency',
    label: 'Tasa de dependencia · CEDLAS',
    description:
      'Relación entre la población en edades dependientes y la población en edad de trabajar',
    unit: 'coeficiente',
    file: '2025_Act1_demographics_LAC.xlsx', sheet: 'dependency', from: '1980-01-01',
    color: '#a88f9f', decimals: 2, category: 'social',
  },
  {
    id: 'cedlas_secondary',
    label: 'Escolarización secundaria · CEDLAS',
    description: 'Proporción de adolescentes que asisten a la escuela secundaria',
    unit: '% de adolescentes',
    file: '2025_Act1_enrollment_LAC.xlsx', sheet: 'secondary', from: '1980-01-01',
    color: '#8fb87f', decimals: 1, category: 'social',
  },
  {
    id: 'cedlas_years_edu',
    label: 'Años de educación · CEDLAS',
    description: 'Años de educación promedio de la población adulta',
    unit: 'años',
    file: '2025_Act1_years_edu_LAC.xlsx', sheet: 'years', from: '1980-01-01',
    color: '#7fb86f', decimals: 2, category: 'social',
  },
  {
    id: 'cedlas_literacy',
    label: 'Alfabetización · CEDLAS',
    description: 'Proporción de la población adulta alfabetizada',
    unit: '% de la población',
    file: '2025_Act1_literacy_LAC.xlsx', sheet: 'age_gender', from: '1980-01-01',
    color: '#9fc98f', decimals: 1, category: 'social',
  },
  {
    id: 'cedlas_housing',
    label: 'Calidad de la vivienda · CEDLAS',
    description: 'Indicador de condiciones de la vivienda',
    unit: 'índice',
    file: '2025_Act1_housing_LAC.xlsx', sheet: 'housing', from: '1980-01-01',
    color: '#c9a87f', decimals: 2, category: 'social',
  },
  {
    id: 'cedlas_infrastructure',
    label: 'Acceso a infraestructura · CEDLAS',
    description: 'Acceso de los hogares a servicios de infraestructura básica',
    unit: 'índice',
    file: '2025_Act1_infrastructure_LAC.xlsx', sheet: 'infrastructure', from: '1980-01-01',
    color: '#b8987f', decimals: 2, category: 'social',
  },
  {
    id: 'cedlas_mobility',
    label: 'Movilidad · CEDLAS',
    description: 'Indicador de movilidad de la población',
    unit: 'índice',
    file: '2025_Act1_mobility_LAC.xlsx', sheet: 'mobility', from: '1980-01-01',
    color: '#8f8fb8', decimals: 2, category: 'social',
  },
  {
    id: 'cedlas_migration',
    label: 'Migración · CEDLAS',
    description: 'Proporción de población migrante',
    unit: '% de la población',
    file: '2025_Act1_regions_migrations_LAC.xlsx', sheet: 'migration', from: '1993-01-01',
    color: '#a87f8f', decimals: 1, category: 'social',
  },
]

const CEDLAS_INDICATORS: Indicator[] = CEDLAS_SPECS.map((spec) => ({
  id: spec.id as IndicatorId,
  label: spec.label,
  description: spec.description,
  unit: spec.unit,
  kind: 'tasa-estado',
  category: spec.category,
  // Anual hasta 2003 y semestral después: se declara la cadencia más espaciada.
  frequency: 'anual',
  color: spec.color,
  decimals: spec.decimals,
  group: 'alternativa',
  originLabel: 'CEDLAS / SEDLAC · metodología armonizada regional',
  series: cedlas(spec.file, spec.sheet, spec.from),
  breaks: [
    {
      date: '2003-07-01',
      kind: 'cobertura',
      short: '2003: EPH continua, 31 aglomerados',
      long:
        'La serie pasa a EPH continua con 31 aglomerados y la frecuencia deja de ser ' +
        'anual para volverse semestral. En los años de cambio de cobertura se conserva ' +
        'la medición de la cobertura que continúa.',
    },
  ],
}))

export const EXTRA_INDICATORS: Indicator[] = [
  ...PRECIOS,
  ...CAMBIARIO,
  ...ACTIVIDAD,
  ...FISCAL,
  ...TRABAJO,
  ...INGRESOS,
  ...CEDLAS_INDICATORS,
]
