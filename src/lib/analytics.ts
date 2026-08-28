import { GTM_CONTAINER_ID } from '../config/site'

/**
 * Google Tag Manager.
 *
 * El contenedor se carga desde acá y no con una etiqueta fija en index.html por
 * dos motivos. Sin contenedor configurado no se le pide nada a Google: el sitio
 * se sirve entero sin tocar un tercero. Y la aplicación cambia de vista sin
 * recargar la página, así que hace falta avisarle a GTM cuándo pasa algo, cosa
 * que el snippet suelto no hace.
 *
 * Lo que se empuja al dataLayer son hechos de la aplicación, no etiquetas: qué
 * panel se abrió y si alguien tocó el botón de apoyo. Qué se hace con eso se
 * decide en GTM, que para eso existe.
 *
 * La medición es deliberadamente gruesa. El estado viaja en el hash (RF-7.1) y
 * cambia con cada click, de modo que seguir el hash llenaría el informe de
 * ruido sin decir nada sobre qué se mira.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

/** Marca el script ya insertado: en desarrollo StrictMode monta dos veces. */
const SCRIPT_ID = 'gtm'

const ID_VALIDO = /^GTM-[A-Z0-9]+$/

export function idConfigurado(id: string = GTM_CONTAINER_ID): boolean {
  return ID_VALIDO.test(id)
}

/** El dataLayer tiene que existir antes que el script que lo lee. */
function dataLayer(): Record<string, unknown>[] {
  window.dataLayer = window.dataLayer ?? []
  return window.dataLayer
}

/**
 * Inserta gtm.js si hay un contenedor válido. No hace nada —ni avisa— cuando
 * está vacío, que es el estado esperado mientras no haya cuenta; un ID puesto
 * pero mal escrito sí avisa, porque ahí la intención era medir y no se mide.
 */
export function iniciarAnalytics(): void {
  if (!GTM_CONTAINER_ID) return

  if (!idConfigurado()) {
    console.warn(
      `[analytics] GTM_CONTAINER_ID no parece un contenedor de GTM: ${GTM_CONTAINER_ID}`
    )
    return
  }

  if (document.getElementById(SCRIPT_ID)) return

  dataLayer().push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`
  document.head.appendChild(script)
}

/** Una vista por panel abierto: es la unidad que significa algo acá. */
export function registrarPanel(panel: string): void {
  if (!idConfigurado()) return
  dataLayer().push({ event: 'panel_view', panel })
}

/** Clicks en el botón de apoyo, para saber si sirve de algo tenerlo. */
export function registrarApoyo(): void {
  if (!idConfigurado()) return
  dataLayer().push({ event: 'cafecito' })
}
