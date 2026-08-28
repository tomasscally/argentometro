import { CAFECITO_USER } from '../config/site'
import { registrarApoyo } from '../lib/analytics'

/**
 * Botón de apoyo por cafecito.app.
 *
 * Es un enlace propio y no el badge que ofrece Cafecito: el sitio es oscuro y
 * el badge oficial es una imagen clara de tamaño fijo servida por su CDN, que
 * además obligaría a pedirle un archivo a un tercero en cada visita.
 */
export function CafecitoButton() {
  // Sin cuenta configurada no se muestra nada, ni un enlace roto.
  if (!CAFECITO_USER) return null

  return (
    <a
      href={`https://cafecito.app/${CAFECITO_USER}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={registrarApoyo}
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border bg-transparent text-gray-500 border-gray-800 hover:text-amber-300 hover:border-amber-700/60 transition-colors"
    >
      <span aria-hidden="true">☕</span>
      Invitame un cafecito
      <span className="sr-only">(se abre en una pestaña nueva)</span>
    </a>
  )
}
