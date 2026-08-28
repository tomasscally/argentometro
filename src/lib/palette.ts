import type { Category, Indicator } from '../types'

/**
 * Colores de las series del gráfico.
 *
 * Antes cada indicador traía su color en el registro, elegido a mano. Con 77
 * indicadores eso produce curvas casi indistinguibles en el mismo panel:
 * «inflación núcleo» y «inflación de regulados» terminaban siendo dos naranjas
 * parecidos.
 *
 * El color se asigna acá, con dos reglas:
 *
 *  1. **El color sigue al indicador, no a su posición en la selección.** Sumar o
 *     quitar una serie no repinta las demás: cada indicador se dibuja siempre
 *     del mismo color, así la lectura no cambia bajo los pies del usuario.
 *  2. **Dentro de una categoría los tonos no se repiten** hasta agotar la
 *     paleta. Los indicadores que se comparan entre sí son casi siempre de la
 *     misma categoría, y ahí es donde la distinción importa.
 *
 * La paleta son tonos cualitativos escalonados para fondo oscuro, validados
 * sobre la superficie del sitio (#111827) con el validador de la guía de
 * visualización: banda de luminosidad, piso de croma, separación para
 * daltonismo, piso de visión normal y contraste 3:1 contra el fondo.
 *
 * **Los primeros cuatro tonos pasan el criterio de todos los pares.** Eso
 * importa acá: en un gráfico de líneas donde el usuario elige cualquier
 * subconjunto, dos series cualesquiera pueden quedar juntas, así que no alcanza
 * validar solo los pares adyacentes. Con más de cuatro series ningún conjunto de
 * ocho tonos separa todos los pares —verificado, no supuesto— y por eso la
 * identidad de cada curva la carga su **etiqueta al final de la línea**, no el
 * color. El color ayuda; el rótulo decide.
 */

/**
 * Tonos en orden fijo. Los primeros cuatro son el conjunto que pasa todos los
 * pares; los siguientes cuatro completan la paleta de referencia.
 */
const HUES = [
  '#3987e5', // azul
  '#c98500', // amarillo
  '#d55181', // magenta
  '#008300', // verde
  '#d95926', // naranja
  '#199e70', // aqua
  '#9085e9', // violeta
  '#e66767', // rojo
] as const

/**
 * Cuando una categoría tiene más indicadores que tonos, se reusa el tono con
 * otra luminosidad. Se prefiere agotar los ocho tonos antes de repetir.
 */
const LIGHTNESS_STEPS = [0, 0.26, -0.24] as const

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

/** Aclara u oscurece un color hacia el blanco o el negro. */
function shift(hex: string, amount: number): string {
  if (amount === 0) return hex
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const target = amount > 0 ? 255 : 0
  const t = Math.abs(amount)
  return (
    '#' +
    channels
      .map((c) => clamp(c + (target - c) * t).toString(16).padStart(2, '0'))
      .join('')
  )
}

export function colorForSlot(slot: number): string {
  const hue = HUES[slot % HUES.length]
  const step = LIGHTNESS_STEPS[Math.floor(slot / HUES.length) % LIGHTNESS_STEPS.length]
  return shift(hue, step)
}

/**
 * Asigna un color a cada indicador: posición dentro de su categoría, en el orden
 * en que el registro los declara. El resultado es estable mientras el registro
 * no cambie.
 */
export function buildColorMap(indicators: Indicator[]): Map<string, string> {
  const seen = new Map<Category, number>()
  const colors = new Map<string, string>()
  for (const indicator of indicators) {
    const slot = seen.get(indicator.category) ?? 0
    seen.set(indicator.category, slot + 1)
    colors.set(indicator.id, colorForSlot(slot))
  }
  return colors
}

export const PALETTE_SIZE = HUES.length
