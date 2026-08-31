import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * La medición no puede depender de que alguien mire el informe para darse
 * cuenta de que no anda. Lo que se verifica acá es lo que no se ve: que sin ID
 * configurado no se contacte a Google, y que lo que se encola sea lo que
 * gtag.js espera encontrar cuando termina de cargar.
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

/** Recarga el módulo con el ID que pida cada caso. */
async function cargarCon(id: string) {
  vi.resetModules()
  vi.doMock('../../config/site', () => ({
    GA_MEASUREMENT_ID: id,
    CAFECITO_USER: 'irrelevante',
  }))
  return import('../analytics')
}

function encolado(): unknown[] {
  return (window as Window).dataLayer ?? []
}

/**
 * gtag.js reconoce sus comandos por recibir el objeto `arguments`. Un array
 * plano lo ignora en silencio, así que el test comprueba las dos cosas: que lo
 * encolado NO sea un array, y qué comando lleva adentro.
 */
function comandos(): unknown[][] {
  return encolado().map((entrada) => {
    expect(Array.isArray(entrada), 'se encoló un array en vez de `arguments`').toBe(false)
    return Array.from(entrada as ArrayLike<unknown>)
  })
}

const ID = 'G-ABCDEFGHIJ'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.doUnmock('../../config/site')
})

describe('reconocimiento del measurement ID', () => {
  it('acepta un ID de GA4', async () => {
    const { idConfigurado } = await cargarCon(ID)
    expect(idConfigurado(ID)).toBe(true)
  })

  it('rechaza un contenedor de GTM, que no es lo mismo', async () => {
    const { idConfigurado } = await cargarCon(ID)
    expect(idConfigurado('GTM-MHV3GRK8')).toBe(false)
  })

  it('rechaza el vacío, la basura y un ID de largo equivocado', async () => {
    const { idConfigurado } = await cargarCon(ID)
    expect(idConfigurado('')).toBe(false)
    expect(idConfigurado('pegar acá')).toBe(false)
    expect(idConfigurado('G-ABC')).toBe(false)
  })
})

describe('arranque', () => {
  it('sin ID no le pide nada a Google', async () => {
    const { insertados } = montarDom()
    const { iniciarAnalytics } = await cargarCon('')

    iniciarAnalytics()

    expect(insertados).toEqual([])
    expect(encolado()).toEqual([])
  })

  it('con el ID mal escrito avisa y no carga nada', async () => {
    const { insertados } = montarDom()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { iniciarAnalytics } = await cargarCon('ABCDEFGHIJ')

    iniciarAnalytics()

    expect(insertados).toEqual([])
    expect(warn).toHaveBeenCalledOnce()
  })

  it('carga gtag.js del ID configurado', async () => {
    const { insertados } = montarDom()
    const { iniciarAnalytics } = await cargarCon(ID)

    iniciarAnalytics()

    expect(insertados).toHaveLength(1)
    expect(insertados[0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${ID}`)
    expect(insertados[0].async).toBe(true)
  })

  it('no carga el script dos veces', async () => {
    const { insertados } = montarDom()
    const { iniciarAnalytics } = await cargarCon(ID)

    iniciarAnalytics()
    iniciarAnalytics()

    expect(insertados).toHaveLength(1)
  })

  it('encola los comandos de arranque que espera gtag.js', async () => {
    montarDom()
    const { iniciarAnalytics } = await cargarCon(ID)

    iniciarAnalytics()

    const [js, config] = comandos()
    expect(js[0]).toBe('js')
    expect(js[1]).toBeInstanceOf(Date)
    // La vista inicial la cuenta gtag: el config no la apaga.
    expect(config).toEqual(['config', ID])
  })
})

describe('hechos que se le informan a Google', () => {
  it('registra el panel abierto como una vista', async () => {
    montarDom()
    const { iniciarAnalytics, registrarPanel } = await cargarCon(ID)

    iniciarAnalytics()
    registrarPanel('metodologia')

    expect(comandos()).toContainEqual([
      'event',
      'page_view',
      { page_title: 'metodologia', page_path: '/metodologia' },
    ])
  })

  it('registra el click en el botón de apoyo', async () => {
    montarDom()
    const { iniciarAnalytics, registrarApoyo } = await cargarCon(ID)

    iniciarAnalytics()
    registrarApoyo()

    expect(comandos()).toContainEqual(['event', 'cafecito', {}])
  })

  // Sin gtag definido las funciones no pueden fallar: se llaman en cada cambio
  // de panel, también cuando la medición está apagada.
  it('sin arrancar la medición no rompen ni encolan nada', async () => {
    montarDom()
    const { registrarPanel, registrarApoyo } = await cargarCon('')

    expect(() => {
      registrarPanel('datos')
      registrarApoyo()
    }).not.toThrow()
    expect(encolado()).toEqual([])
  })
})
