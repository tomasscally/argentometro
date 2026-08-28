import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * La medición no puede depender de que alguien mire el informe para darse
 * cuenta de que no anda. Lo que se verifica acá es lo que no se ve: que sin
 * contenedor configurado no se contacte a Google, y que lo que se empuja al
 * dataLayer sea lo que GTM espera encontrar.
 */

interface ScriptFalso {
  id: string
  async: boolean
  src: string
}

/** El entorno de tests es node (vitest.config.ts): el DOM se arma a mano. */
function montarDom() {
  const insertados: ScriptFalso[] = []

  vi.stubGlobal('window', {} as Window)
  vi.stubGlobal('document', {
    getElementById: (id: string) => insertados.find((s) => s.id === id) ?? null,
    createElement: (): ScriptFalso => ({ id: '', async: false, src: '' }),
    head: {
      appendChild: (script: ScriptFalso) => {
        insertados.push(script)
      },
    },
  })

  return { insertados }
}

/** Recarga el módulo con el contenedor que pida cada caso. */
async function cargarCon(contenedor: string) {
  vi.resetModules()
  vi.doMock('../../config/site', () => ({
    GTM_CONTAINER_ID: contenedor,
    CAFECITO_USER: 'irrelevante',
  }))
  return import('../analytics')
}

function eventos(): Record<string, unknown>[] {
  return (window as Window).dataLayer ?? []
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.doUnmock('../../config/site')
})

describe('reconocimiento del contenedor', () => {
  it('acepta un contenedor de GTM', async () => {
    const { idConfigurado } = await cargarCon('GTM-MHV3GRK8')
    expect(idConfigurado('GTM-MHV3GRK8')).toBe(true)
  })

  it('rechaza un measurement ID de GA4, que no es lo mismo', async () => {
    const { idConfigurado } = await cargarCon('GTM-MHV3GRK8')
    expect(idConfigurado('G-ABCDEFGHIJ')).toBe(false)
  })

  it('rechaza el vacío y la basura', async () => {
    const { idConfigurado } = await cargarCon('GTM-MHV3GRK8')
    expect(idConfigurado('')).toBe(false)
    expect(idConfigurado('pegar acá')).toBe(false)
  })
})

describe('arranque', () => {
  it('sin contenedor no le pide nada a Google', async () => {
    const { insertados } = montarDom()
    const { iniciarAnalytics } = await cargarCon('')

    iniciarAnalytics()

    expect(insertados).toEqual([])
    expect(eventos()).toEqual([])
  })

  it('con el contenedor mal escrito avisa y no carga nada', async () => {
    const { insertados } = montarDom()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { iniciarAnalytics } = await cargarCon('MHV3GRK8')

    iniciarAnalytics()

    expect(insertados).toEqual([])
    expect(warn).toHaveBeenCalledOnce()
  })

  it('carga gtm.js del contenedor configurado', async () => {
    const { insertados } = montarDom()
    const { iniciarAnalytics } = await cargarCon('GTM-MHV3GRK8')

    iniciarAnalytics()

    expect(insertados).toHaveLength(1)
    expect(insertados[0].src).toBe(
      'https://www.googletagmanager.com/gtm.js?id=GTM-MHV3GRK8'
    )
    expect(insertados[0].async).toBe(true)
  })

  it('deja el evento de arranque antes de cargar el script', async () => {
    montarDom()
    const { iniciarAnalytics } = await cargarCon('GTM-MHV3GRK8')

    iniciarAnalytics()

    expect(eventos()[0]).toMatchObject({ event: 'gtm.js' })
  })

  it('no carga el script dos veces', async () => {
    const { insertados } = montarDom()
    const { iniciarAnalytics } = await cargarCon('GTM-MHV3GRK8')

    iniciarAnalytics()
    iniciarAnalytics()

    expect(insertados).toHaveLength(1)
  })
})

describe('hechos que se le informan a GTM', () => {
  it('registra el panel abierto', async () => {
    montarDom()
    const { registrarPanel } = await cargarCon('GTM-MHV3GRK8')

    registrarPanel('metodologia')

    expect(eventos()).toContainEqual({ event: 'panel_view', panel: 'metodologia' })
  })

  it('registra el click en el botón de apoyo', async () => {
    montarDom()
    const { registrarApoyo } = await cargarCon('GTM-MHV3GRK8')

    registrarApoyo()

    expect(eventos()).toContainEqual({ event: 'cafecito' })
  })

  it('sin contenedor no acumula eventos en el dataLayer', async () => {
    montarDom()
    const { registrarPanel, registrarApoyo } = await cargarCon('')

    registrarPanel('datos')
    registrarApoyo()

    expect(eventos()).toEqual([])
  })
})
