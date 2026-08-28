import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GLOSSARY, GLOSSARY_BY_ID } from '../glossary'

const SRC = join(process.cwd(), 'src')

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry !== '__tests__') sourceFiles(full, acc)
    } else if (/\.tsx$/.test(entry)) {
      acc.push(full)
    }
  }
  return acc
}

describe('glosario', () => {
  it('no repite identificadores', () => {
    const ids = GLOSSARY.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada término explica qué es y por qué importa', () => {
    for (const term of GLOSSARY) {
      expect(term.label.length, term.id).toBeGreaterThan(0)
      expect(term.summary.length, term.id).toBeGreaterThan(20)
      // El detalle dice cómo cambia la lectura del número, no repite el resumen.
      expect(term.detail.length, term.id).toBeGreaterThan(term.summary.length)
    }
  })

  it('cubre todas las marcas que usa la interfaz', () => {
    const usadas = new Set<string>()
    for (const file of sourceFiles(SRC)) {
      const code = readFileSync(file, 'utf8')
      for (const m of code.matchAll(/term="([a-z-]+)"/g)) usadas.add(m[1])
      for (const m of code.matchAll(/openGlossary\('([a-z-]+)'\)/g)) usadas.add(m[1])
    }
    expect(usadas.size, 'la interfaz no está usando el glosario').toBeGreaterThan(4)
    for (const id of usadas) {
      expect(
        GLOSSARY_BY_ID[id as keyof typeof GLOSSARY_BY_ID],
        `la interfaz usa el término "${id}", que no está en el glosario`
      ).toBeDefined()
    }
  })

  it('las marcas de la tabla son botones al glosario, no spans con title', () => {
    // El problema que resolvió esta funcionalidad: un `title` no se ve en
    // teléfonos ni se alcanza con el teclado.
    const stats = readFileSync(join(SRC, 'components', 'SummaryStats.tsx'), 'utf8')

    for (const [term, etiqueta] of [
      ['en-curso', 'en curso'],
      ['quiebre', 'quiebre'],
      ['a-caballo', 'a caballo'],
      ['recortado', 'recortado'],
      ['faltan', 'faltan'],
    ]) {
      expect(stats, `falta el enlace al término "${term}"`).toContain(`term="${term}"`)
      expect(stats, `falta la etiqueta "${etiqueta}"`).toContain(etiqueta)
    }

    // Ya no queda ningún span cuya única explicación sea un title.
    expect(stats).not.toMatch(/<span[^>]*\stitle=/)
  })
})
