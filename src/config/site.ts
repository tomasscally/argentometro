/**
 * Datos del sitio que no salen de ninguna fuente estadística: a quién se puede
 * apoyar y con qué cuenta se mide el tráfico.
 *
 * Van acá y no en variables de entorno porque ninguno de los dos es un secreto
 * —ambos viajan en el HTML público de todas formas— y porque hacerlos
 * variables obligaría a cargar secrets en el repositorio para que el deploy de
 * Pages los inyecte, sin ganar nada a cambio.
 */

/**
 * Usuario de cafecito.app. Vacío oculta el botón, así que el sitio sigue
 * funcionando mientras la cuenta no exista.
 */
export const CAFECITO_USER = 'tomasscally'

/**
 * Contenedor de Google Tag Manager: la «GTM-» que figura en Administrar ›
 * Instalar Google Tag Manager.
 *
 * El contenedor es el que decide qué se mide; el sitio solo lo carga y le
 * avisa qué está pasando. Vacío deja el sitio sin medición y sin pedirle nada
 * a Google: no se carga ningún script de terceros hasta que esto tenga valor.
 */
export const GTM_CONTAINER_ID = 'GTM-MHV3GRK8'
