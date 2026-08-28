import { describe, expect, it } from 'vitest'
import {
  ALL_SOURCES,
  APPROVED_HOSTS,
  SOURCES,
  UnapprovedSourceError,
  assertHostApproved,
  assertSourceApproved,
} from '../sources'
import { INDICATORS } from '../indicators'

describe('control mecánico de fuentes (RF-0.2, RNF-6)', () => {
  it('ningún indicador referencia una fuente que no esté aprobada', () => {
    for (const indicator of INDICATORS) {
      for (const ref of indicator.series) {
        const source = SOURCES[ref.sourceId]
        expect(source, `${indicator.id} referencia ${ref.sourceId}`).toBeDefined()
        expect(
          source.state,
          `${indicator.id} usa ${ref.sourceId}, cuyo estado es "${source.state}"`
        ).toBe('aprobada')
      }
    }
  })

  it('assertSourceApproved acepta una fuente aprobada', () => {
    expect(assertSourceApproved('datos-gob-ar').id).toBe('datos-gob-ar')
  })

  it('assertSourceApproved rechaza una fuente desconocida', () => {
    // @ts-expect-error se prueba deliberadamente un id fuera del tipo
    expect(() => assertSourceApproved('inventada')).toThrow(UnapprovedSourceError)
  })

  it('rechaza un host que no pertenece a ninguna fuente aprobada', () => {
    expect(() => assertHostApproved('https://ejemplo.com/series')).toThrow(
      UnapprovedSourceError
    )
  })

  it('acepta un host de una fuente aprobada con acceso por API', () => {
    expect(() =>
      assertHostApproved('https://apis.datos.gob.ar/series/api/series?ids=x')
    ).not.toThrow()
  })

  it('no habilita hosts de fuentes que se consumen por snapshot', () => {
    expect(APPROVED_HOSTS).not.toContain('indec.gob.ar')
    expect(APPROVED_HOSTS).not.toContain('cedlas.econo.unlp.edu.ar')
  })

  it('toda fuente aprobada tiene fecha de aprobación y enlace (RF-0.1, RF-9.6)', () => {
    for (const source of ALL_SOURCES) {
      if (source.state !== 'aprobada') continue
      expect(source.approvedOn, `${source.id} sin fecha de aprobación`).toBeTruthy()
      expect(source.url, `${source.id} sin enlace`).toMatch(/^https:\/\//)
      expect(source.verifiedOn, `${source.id} sin fecha de verificación`).toBeTruthy()
    }
  })

  it('una fuente sin CORS no puede consumirse por API', () => {
    for (const source of ALL_SOURCES) {
      if (!source.cors) expect(source.access).toBe('snapshot')
    }
  })
})
