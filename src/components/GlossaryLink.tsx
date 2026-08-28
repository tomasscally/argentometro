import type { ReactNode } from 'react'
import type { GlossaryTermId } from '../lib/glossary'
import { useGlossary } from '../lib/glossaryContext'

interface Props {
  term: GlossaryTermId
  children: ReactNode
  /** Clases del recuadro, para que cada marca conserve su color. */
  className?: string
}

/**
 * Una marca de tabla, como botón. Antes era un `span` con `title`: no se veía en
 * teléfonos ni se alcanzaba con el teclado, así que quien no usa mouse no tenía
 * forma de saber qué significaba.
 */
export function GlossaryBadge({ term, children, className = '' }: Props) {
  const open = useGlossary()
  return (
    <button
      type="button"
      onClick={() => open(term)}
      title="Ver qué significa"
      className={`text-[9px] rounded px-1 border cursor-pointer transition-colors hover:brightness-125 ${className}`}
    >
      {children}
    </button>
  )
}
