# Argentómetro

**Monitor Estadístico Argentina**

Comparar la evolución de indicadores económicos y sociales argentinos entre
gestiones presidenciales y entre países, con datos de fuentes aprobadas y la
metodología a la vista.

**https://tomasscally.github.io/argentometro/**

Los requerimientos completos están en
[docs/requerimientos-funcionales.md](docs/requerimientos-funcionales.md).

## Cómo funciona

La aplicación es estática y **no consulta las APIs desde el navegador**: lee
copias locales de las series, publicadas junto al sitio en `public/data/`. Esas
copias se refrescan **automáticamente una vez por día** con un job programado
que las commitea y dispara el deploy, así que el visitante recibe el dato del
día sin que nadie actualice nada a mano.

Cada copia lleva su procedencia —URL exacta, momento de la descarga, hash y
cantidad de filas— y la interfaz muestra siempre de cuándo es.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la aplicación en desarrollo |
| `npm run build` | Compila el sitio estático en `dist/` |
| `npm test` | Corre la suite de tests |
| `npm run lint` | Revisa el código |
| `npm run snapshot` | Toma copia de todas las series desde las fuentes |
| `npm run snapshot -- inflation` | Toma copia solo de los indicadores indicados |
| `npm run verificar-series` | Verifica el catálogo contra el dump oficial de metadatos |
| `npm run cargar-csv -- …` | Backoffice: incorpora una serie desde un CSV |

## Fuentes de datos

Ninguna fuente se consulta sin estar aprobada en el registro de
[src/data/sources.ts](src/data/sources.ts), y un test hace fallar el build si un
indicador referencia una que no lo está.

Los identificadores de las series de `apis.datos.gob.ar` salen del dump oficial
de metadatos, que es donde la documentación de la API indica que están. El job
diario verifica contra ese dump que ninguna serie del catálogo haya sido
discontinuada: la API sigue devolviendo el dato viejo sin error, así que sin esta
verificación uno se entera cuando el número ya quedó congelado.

Hoy se usan: Series de Tiempo AR (Ministerio de Economía), BCRA, World Bank y
CEDLAS/SEDLAC (UNLP y Banco Mundial). Todas son organismos oficiales, un
organismo internacional o un centro académico.

No se usan agregadores: un tercero que redistribuye dato de otro no permite
verificar contra el emisor qué se publicó ni cuándo cambió.

## Principios que el código respeta

- El dato oficial se muestra **siempre completo**. Las mediciones provinciales y
  académicas son series adicionales seleccionables, nunca sustitutos.
- Los huecos se muestran como huecos. No se interpola ni se rellena.
- Los cambios de metodología se anotan **sobre el gráfico**, con su fecha.
- Cada serie se grafica con **su** frecuencia de publicación. No se colapsa ni
  se remuestrea.
- Un fallo se muestra; nunca se degrada en silencio a otra fuente.
- La métrica agregada depende del tipo de indicador: la inflación se acumula
  componiendo, no promediando.

## Cargar una serie propia (administración)

El público no puede cargar series. Un administrador con acceso al repositorio
puede incorporar una desde un CSV:

```bash
npm run cargar-csv -- datos.csv --id mi_serie --label "Mi serie" \
  --unit "% mensual" --frequency mensual --kind tasa-flujo \
  --origen "Quién produce el dato"
```

Queda con procedencia registrada, y el historial de git es la auditoría.

## Publicación

El sitio es estático y se publica en GitHub Pages con `.github/workflows/deploy.yml`,
que corre en cada push a `main` después de pasar lint, tests y build.

El refresco diario de datos lo **invoca** en lugar de esperar que su propio
commit lo despierte: GitHub no dispara workflows con eventos originados por el
`GITHUB_TOKEN`, así que un deploy encadenado por push nunca llegaría a correr y
el sitio se quedaría con la copia anterior.

Para activarlo, en el repositorio: **Settings → Pages → Source: GitHub Actions**.

El refresco diario de datos lo hace `.github/workflows/actualizar-datos.yml`, que
necesita permiso de escritura: **Settings → Actions → General → Workflow
permissions → Read and write permissions**.

El sitio funciona igual en la raíz de un dominio o en un subdirectorio: Vite está
configurado con `base: './'` y las rutas son relativas.

## Medición y apoyo

Los dos valores que no salen de ninguna fuente estadística —la cuenta de
cafecito.app y el contenedor de Google Tag Manager— están en
[src/config/site.ts](src/config/site.ts), que es el único lugar donde tocarlos.
Cualquiera de los dos vacío desactiva lo suyo: sin contenedor no se carga ningún
script de terceros, y sin cuenta no se muestra el botón.

Al dataLayer se empujan hechos de la aplicación, no etiquetas; qué se hace con
ellos se decide en GTM:

| Evento | Cuándo |
|---|---|
| `panel_view` | se abre un panel; trae `panel` con `datos`, `fuentes` o `metodologia` |
| `cafecito` | click en el botón de apoyo |

No se sigue el hash de la URL: cambia con cada control (RF-7.1) y llenaría el
informe de ruido sin decir qué se está mirando. El panel es la unidad que
significa algo.

## Licencia

Código bajo licencia MIT (ver [LICENSE](LICENSE)). Los datos publicados en
`public/data/` pertenecen a sus organismos de origen y se rigen por las
condiciones de cada fuente.
