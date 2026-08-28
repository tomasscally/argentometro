import { describe, expect, it } from 'vitest'
import { INDICATORS } from '../../data/indicators'
import { PALETTE_SIZE, buildColorMap, colorForSlot } from '../palette'

/** Distancia euclídea en RGB: suficiente para detectar dos colores casi iguales. */
function distance(a: string, b: string): number {
  const ch = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [r1, g1, b1] = ch(a)
  const [r2, g2, b2] = ch(b)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

describe('paleta de series', () => {
  it('los ocho tonos son distintos entre sí', () => {
    const hues = Array.from({ length: PALETTE_SIZE }, (_, i) => colorForSlot(i))
    expect(new Set(hues).size).toBe(PALETTE_SIZE)
  })

  it('los primeros cuatro son el conjunto validado para todos los pares', () => {
    // Verificado con el validador de la guía de visualización: con selección
    // arbitraria solo cuatro tonos separan todos los pares. Más allá de cuatro
    // la identidad la carga la etiqueta al final de la línea, no el color.
    const primeros = [0, 1, 2, 3].map(colorForSlot)
    expect(primeros).toEqual(['#3987e5', '#c98500', '#d55181', '#008300'])
    for (let i = 0; i < primeros.length; i++) {
      for (let j = i + 1; j < primeros.length; j++) {
        expect(
          distance(primeros[i], primeros[j]),
          `${primeros[i]} vs ${primeros[j]}`
        ).toBeGreaterThan(90)
      }
    }
  })

  it('al agotar los tonos escalona la luminosidad en vez de repetir', () => {
    const primero = colorForSlot(0)
    const repetido = colorForSlot(PALETTE_SIZE)
    expect(repetido).not.toBe(primero)
    expect(distance(primero, repetido)).toBeGreaterThan(40)
  })

  it('devuelve colores hexadecimales válidos para cualquier posición', () => {
    for (let i = 0; i < 40; i++) {
      expect(colorForSlot(i)).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('asignación a los indicadores', () => {
  it('ningún par de la misma categoría comparte color', () => {
    const byCategory = new Map<string, typeof INDICATORS>()
    for (const indicator of INDICATORS) {
      const list = byCategory.get(indicator.category) ?? []
      list.push(indicator)
      byCategory.set(indicator.category, list)
    }

    for (const [category, items] of byCategory) {
      const colors = items.map((i) => i.color)
      expect(
        new Set(colors).size,
        `la categoría "${category}" repite color entre ${items.length} indicadores`
      ).toBe(items.length)
    }
  })

  it('los colores de una misma categoría no son casi iguales', () => {
    // El caso que motivó el cambio: inflación núcleo y de regulados eran dos
    // naranjas parecidos.
    const nucleo = INDICATORS.find((i) => i.id === 'inflation_core')!
    const regulados = INDICATORS.find((i) => i.id === 'inflation_regulated')!
    expect(distance(nucleo.color, regulados.color)).toBeGreaterThan(90)
  })

  it('todos los indicadores tienen color asignado', () => {
    for (const indicator of INDICATORS) {
      expect(indicator.color, indicator.id).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('la asignación es estable: no depende de la selección', () => {
    const primera = buildColorMap(INDICATORS)
    const segunda = buildColorMap(INDICATORS)
    for (const indicator of INDICATORS) {
      expect(segunda.get(indicator.id)).toBe(primera.get(indicator.id))
    }
  })

  it('quitar una serie no repinta las que quedan', () => {
    // buildColorMap se aplica al registro completo, no a la selección: por eso
    // el color de un indicador no puede cambiar al deseleccionar otro.
    const completo = buildColorMap(INDICATORS)
    const sinLaPrimera = buildColorMap(INDICATORS)
    const objetivo = INDICATORS[INDICATORS.length - 1].id
    expect(sinLaPrimera.get(objetivo)).toBe(completo.get(objetivo))
  })
})
