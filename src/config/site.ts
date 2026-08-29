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
 * Measurement ID de Google Analytics 4: la «G-» seguida de diez caracteres.
 * Está en Analytics › Administrar › Flujos de datos, al abrir el flujo del
 * sitio, arriba a la derecha.
 *
 * Es lo único que hay que configurar para medir: pegar el ID acá y desplegar.
 * Vacío deja el sitio sin medición y sin pedirle nada a Google, que es el
 * estado esperado mientras no haya cuenta.
 */
export const GA_MEASUREMENT_ID = 'G-F716LGFW3M'
