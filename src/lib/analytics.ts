import { GA_MEASUREMENT_ID } from '../config/site'

/**
 * Google Analytics 4.
 *
 * Se carga desde acá y no con una etiqueta fija en index.html por dos motivos.
 * Sin ID configurado no se le pide nada a Google: el sitio se sirve entero sin
 * tocar un tercero. Y la aplicación cambia de vista sin recargar la página, así
 * que el pageview automático de gtag mediría una sola visita por sesión.
 *
 * La medición es deliberadamente gruesa: interesa qué panel se mira, no cada
 * movimiento de un control. El estado viaja en el hash (RF-7.1) y cambia con
 * cada click, de modo que seguir el hash llenaría el informe de ruido.
 *
 * La vista inicial la cuenta gtag solo; acá se agregan los cambios de panel,
 * que sin recarga de página no generarían ninguna.
 */

type GtagArgs =
  | ['js', Date]
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

/** Marca el script ya insertado: en desarrollo StrictMode monta dos veces. */
const SCRIPT_ID = 'ga4'

const ID_VALIDO = /^G-[A-Z0-9]{10}$/

export function idConfigurado(id: string = GA_MEASUREMENT_ID): boolean {
  return ID_VALIDO.test(id)
}

/**
 * Inserta gtag.js si hay un ID válido. No hace nada —ni avisa— cuando el ID
 * está vacío, que es el estado esperado mientras no haya cuenta; un ID puesto
 * pero mal escrito sí avisa, porque ahí la intención era medir y no se mide.
 */
export function iniciarAnalytics(): void {
  if (!GA_MEASUREMENT_ID) return

  if (!idConfigurado()) {
    console.warn(
      `[analytics] GA_MEASUREMENT_ID no parece un ID de GA4: ${GA_MEASUREMENT_ID}`
    )
    return
  }

  if (document.getElementById(SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  const cola: unknown[] = window.dataLayer ?? []
  window.dataLayer = cola
  // Se encola el objeto `arguments` y no un array: gtag.js reconoce sus
  // comandos por recibir `arguments`, y con un array los ignora en silencio.
  // Es lo que hace el snippet oficial y no hay motivo para desviarse.
  // La firma tipada va afuera y el cuerpo no declara parámetros: `arguments`
  // no se puede usar en una función que los declare.
  const gtag = function (): void {
    // La regla es buena en general; acá `arguments` es un requisito de gtag.js.
    // eslint-disable-next-line prefer-rest-params
    cola.push(arguments)
  } as (...args: GtagArgs) => void
  window.gtag = gtag

  gtag('js', new Date())
  // Sin `send_page_view: false`: la vista inicial la manda gtag al
  // configurarse, igual que en el snippet oficial. Así la medición básica no
  // depende de que la aplicación se acuerde de informar nada, y los cambios de
  // panel se agregan aparte (registrarPanel).
  gtag('config', GA_MEASUREMENT_ID)
}

/** Una vista por panel abierto: es la unidad que significa algo acá. */
export function registrarPanel(panel: string): void {
  window.gtag?.('event', 'page_view', {
    page_title: panel,
    page_path: `/${panel}`,
  })
}

/** Clicks en el botón de apoyo, para saber si sirve de algo tenerlo. */
export function registrarApoyo(): void {
  window.gtag?.('event', 'cafecito', {})
}
