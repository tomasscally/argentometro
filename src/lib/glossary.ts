/**
 * Glosario de las marcas que aparecen en las tablas de comparación.
 *
 * Cada marca dice algo que cambia cómo hay que leer el número que tiene al
 * lado, y ninguna se explica sola. Antes vivían en un `title`, que no se ve en
 * teléfonos ni con teclado: ahora son botones que llevan acá.
 */

export type GlossaryTermId =
  | 'en-curso'
  | 'quiebre'
  | 'a-caballo'
  | 'recortado'
  | 'faltan'
  | 'observaciones'
  | 'calculado'

export interface GlossaryTerm {
  id: GlossaryTermId
  label: string
  /** Una línea: qué significa. */
  summary: string
  /** Por qué importa para leer el número. */
  detail: string
  example?: string
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    id: 'en-curso',
    label: 'en curso',
    summary: 'La gestión no terminó: su período está incompleto.',
    detail:
      'Una métrica acumulada sobre un período incompleto no es comparable con la de ' +
      'una gestión completa. Cuatro años de inflación acumulada siempre van a dar más ' +
      'que dos, sin que eso signifique nada. Para compararlas conviene mirar la ' +
      'columna anualizada, que lleva ambas a la misma unidad de tiempo.',
  },
  {
    id: 'quiebre',
    label: 'quiebre',
    summary: 'Dentro del período hubo un cambio en cómo se mide el indicador.',
    detail:
      'Un cambio de base, de cobertura geográfica, de metodología o de organismo ' +
      'parte la serie en dos tramos que no son estrictamente comparables. La métrica ' +
      'de esa gestión cruza los dos tramos, así que mezcla mediciones hechas de ' +
      'formas distintas.',
    example:
      'El IPC pasó a tener cobertura nacional en diciembre de 2016; antes cubría solo ' +
      'el Gran Buenos Aires. La gestión que contiene esa fecha cruza las dos coberturas.',
  },
  {
    id: 'a-caballo',
    label: 'a caballo',
    summary:
      'Alguna observación cubre un período que se extiende más allá del traspaso.',
    detail:
      'Cada observación se asigna a la gestión donde cae su fecha de inicio. Pero un ' +
      'dato semestral o trimestral representa varios meses, y si esos meses cruzan el ' +
      'cambio de gobierno, parte de lo que mide corresponde a la gestión siguiente. ' +
      'El número no está mal: está atribuido a una gestión aunque describa un tramo ' +
      'que abarca a las dos.',
    example:
      'El dato de pobreza del segundo semestre de 2015 cubre de julio a diciembre, y ' +
      'el traspaso fue el 10 de diciembre.',
  },
  {
    id: 'recortado',
    label: 'recortado',
    summary: 'El rango de fechas elegido no cubre toda la gestión.',
    detail:
      'La métrica corresponde solo al tramo visible, no a la gestión completa. Si ' +
      'ampliás la ventana de tiempo, el número cambia. Para ver el período completo ' +
      'de una gestión alcanza con elegirla en los botones de gestiones.',
  },
  {
    id: 'faltan',
    label: 'faltan N',
    summary:
      'La serie no tiene todas las observaciones que su frecuencia haría esperar.',
    detail:
      'Hay períodos sin dato publicado dentro de la gestión, así que la métrica ' +
      'acumulada no cubre todo el período. No es un error del cálculo sino un límite ' +
      'de los datos disponibles: se muestra el número que se puede calcular, y cuántas ' +
      'observaciones le faltan.',
    example:
      'El IPC no se publicó entre noviembre de 2015 y abril de 2016. Ese hueco cae ' +
      'dentro de la gestión de Mauricio Macri, así que su inflación acumulada cubre ' +
      '44 de los 48 meses.',
  },
  {
    id: 'observaciones',
    label: 'columna «Obs.»',
    summary: 'Cuántas observaciones se usaron para calcular la fila.',
    detail:
      'Cuando aparece como una fracción —«44/48»— el primer número son las ' +
      'observaciones disponibles y el segundo las que la frecuencia haría esperar para ' +
      'ese período. Una fracción con faltantes se muestra en ámbar.',
  },
  {
    id: 'calculado',
    label: 'calculado',
    summary: 'El indicador no lo publica ninguna fuente: lo calcula la aplicación.',
    detail:
      'Se deriva de otros dos indicadores con una operación declarada, y su ' +
      'procedencia registra cuáles son y qué operación se aplicó. La brecha cambiaria ' +
      'es la diferencia porcentual entre el dólar informal y el oficial; el salario ' +
      'real es el salario registrado dividido por un índice de precios.',
  },
]

export const GLOSSARY_BY_ID: Record<GlossaryTermId, GlossaryTerm> = Object.fromEntries(
  GLOSSARY.map((t) => [t.id, t])
) as Record<GlossaryTermId, GlossaryTerm>
