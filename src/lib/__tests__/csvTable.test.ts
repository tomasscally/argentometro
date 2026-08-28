import { describe, expect, it } from 'vitest'
import { parseCsvRecords, parseCsvTable } from '../csvTable'

describe('parseo de CSV', () => {
  it('respeta las comas dentro de comillas', () => {
    // El caso real del dump: las descripciones traen comas.
    const csv = 'id,desc\n1,"IPC. Núcleo, Nacional. Base dic 2016"\n'
    expect(parseCsvTable(csv)[1]).toEqual(['1', 'IPC. Núcleo, Nacional. Base dic 2016'])
  })

  it('acepta comillas escapadas', () => {
    expect(parseCsvTable('a\n"dice ""hola"""\n')[1]).toEqual(['dice "hola"'])
  })

  it('acepta saltos de línea de Windows', () => {
    expect(parseCsvTable('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('conserva los campos vacíos', () => {
    expect(parseCsvTable('a,b,c\n1,,3\n')[1]).toEqual(['1', '', '3'])
  })

  it('acepta un salto de línea dentro de un campo entrecomillado', () => {
    expect(parseCsvTable('a\n"dos\nlíneas"\n')[1]).toEqual(['dos\nlíneas'])
  })

  it('no pierde la última fila sin salto final', () => {
    expect(parseCsvTable('a,b\n1,2')).toHaveLength(2)
  })

  it('devuelve vacío ante un texto vacío', () => {
    expect(parseCsvTable('')).toEqual([])
  })

  it('parseCsvRecords usa la primera fila como encabezado', () => {
    const registros = parseCsvRecords('serie_id,serie_discontinuada\n148.3_X,False\n')
    expect(registros).toEqual([{ serie_id: '148.3_X', serie_discontinuada: 'False' }])
  })

  it('completa con vacío las columnas que falten en una fila', () => {
    expect(parseCsvRecords('a,b,c\n1,2\n')[0]).toEqual({ a: '1', b: '2', c: '' })
  })
})
