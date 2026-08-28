import { describe, expect, it } from 'vitest'
import { INDICATORS, getIndicator } from '../indicators'
import { governmentAt } from '../governments'
import { pointsForGovernment } from '../../lib/metrics'
import type { DataPoint } from '../../types'

/**
 * Regresión del bug del tipo de cambio.
 *
 * La serie diaria se colapsaba a mensual con `end_of_period`: la API devolvía
 * el valor del ÚLTIMO día del mes pero etiquetado con el PRIMER día. Para
 * diciembre de 2023 eso significaba atribuir a Alberto Fernández —que entregó
 * el 10— un tipo de cambio de 808,48, resultado de la devaluación del 13,
 * ya bajo la gestión siguiente.
 *
 * La regla: se respeta la frecuencia de publicación de cada serie. No se
 * colapsa, no se remuestrea, no se reetiqueta.
 */

describe('frecuencias de publicación', () => {
  it('el tipo de cambio se declara diario, como lo publica la fuente', () => {
    expect(getIndicator('exchange_rate').frequency).toBe('diaria')
  })

  it('cada indicador declara una frecuencia', () => {
    for (const indicator of INDICATORS) {
      expect(indicator.frequency, indicator.id).toBeTruthy()
    }
  })
})

describe('traspaso del 10 de diciembre de 2023', () => {
  // Valores reales de la serie 175.1_DR_REFE500_0_0_25.
  const daily: DataPoint[] = [
    { date: '2023-12-08', value: 364.41 },
    { date: '2023-12-10', value: 364.41 },
    { date: '2023-12-11', value: 366.0 },
    { date: '2023-12-12', value: 366.5 },
    { date: '2023-12-13', value: 799.98 },
    { date: '2023-12-29', value: 808.48 },
  ]

  const alberto = governmentAt('2023-12-01')!
  const milei = governmentAt('2023-12-11')!

  it('identifica correctamente cada gestión', () => {
    expect(alberto.id).toBe('alberto-fernandez')
    expect(milei.id).toBe('milei')
  })

  it('a Alberto Fernández no se le atribuye la devaluación del 13', () => {
    const suyos = pointsForGovernment(daily, alberto)
    // El 10 es el día de asunción del sucesor, así que ya no le corresponde
    // (RF-6.2, intervalo cerrado a izquierda y abierto a derecha).
    expect(suyos[suyos.length - 1]).toEqual({ date: '2023-12-08', value: 364.41 })
    // Lo esencial: ningún valor posterior a la devaluación le queda asignado.
    expect(suyos.every((p) => p.value < 400)).toBe(true)
  })

  it('la devaluación del 13 de diciembre queda en la gestión entrante', () => {
    const suyos = pointsForGovernment(daily, milei)
    expect(suyos.map((p) => p.date)).toEqual([
      '2023-12-10',
      '2023-12-11',
      '2023-12-12',
      '2023-12-13',
      '2023-12-29',
    ])
    expect(suyos.some((p) => p.value > 700)).toBe(true)
  })

  it('un punto mensual etiquetado 2023-12-01 caería del lado equivocado', () => {
    // Demostración del bug que se corrigió: con la fecha de inicio de mes, el
    // valor de fin de mes queda dentro de la ventana de la gestión saliente.
    const colapsado: DataPoint[] = [{ date: '2023-12-01', value: 808.48 }]
    expect(pointsForGovernment(colapsado, alberto)).toHaveLength(1)
    expect(pointsForGovernment(colapsado, milei)).toHaveLength(0)
  })
})
