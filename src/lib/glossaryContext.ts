import { createContext, useContext } from 'react'
import type { GlossaryTermId } from './glossary'

/**
 * Permite que una marca en una tabla anidada lleve al glosario sin pasar la
 * función por cuatro niveles de componentes.
 */
export const GlossaryContext = createContext<(id: GlossaryTermId) => void>(() => {})

export function useGlossary() {
  return useContext(GlossaryContext)
}
