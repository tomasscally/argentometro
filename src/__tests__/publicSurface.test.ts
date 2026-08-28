import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * RNF-6b — el bundle público no puede exponer ningún control de carga de
 * archivos. El público no carga series (RF-8.1); la carga es administrativa.
 */

const SRC = join(process.cwd(), 'src')

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue
      sourceFiles(full, acc)
    } else if (/\.tsx?$/.test(entry) && !entry.endsWith('.test.ts')) {
      acc.push(full)
    }
  }
  return acc
}

describe('superficie pública', () => {
  const files = sourceFiles(SRC)
  const components = files.filter((f) => f.endsWith('.tsx'))

  it('encuentra los componentes que va a revisar', () => {
    expect(components.length).toBeGreaterThan(3)
  })

  it('ningún componente renderiza un input de tipo file', () => {
    const offenders = components.filter((f) =>
      /type\s*=\s*["']file["']/.test(readFileSync(f, 'utf8'))
    )
    expect(offenders, `componentes con input file: ${offenders.join(', ')}`).toEqual([])
  })

  it('ningún componente maneja drop de archivos', () => {
    const offenders = components.filter((f) =>
      /onDrop|dataTransfer/.test(readFileSync(f, 'utf8'))
    )
    expect(offenders, `componentes con drop: ${offenders.join(', ')}`).toEqual([])
  })

  it('la interfaz pública no importa el parser de CSV', () => {
    const offenders = components.filter((f) =>
      /from\s+['"][^'"]*csvParser['"]/.test(readFileSync(f, 'utf8'))
    )
    expect(offenders, `componentes que importan csvParser: ${offenders.join(', ')}`).toEqual([])
  })

  it('no quedan datos de indicadores hardcodeados', () => {
    const offenders = files.filter((f) => /sampleData/i.test(readFileSync(f, 'utf8')))
    expect(offenders, `referencias a datos de ejemplo: ${offenders.join(', ')}`).toEqual([])
  })
})
