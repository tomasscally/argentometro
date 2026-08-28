import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: el sitio funciona igual en la raíz de un dominio o en un
  // subdirectorio, sin reconfigurar nada (RNF-1, hosting estático cualquiera).
  base: './',
  build: {
    // El presupuesto de RNF-2 es 1 MB gzip; el aviso por defecto de Vite es
    // muy inferior y solo agregaría ruido en cada build.
    chunkSizeWarningLimit: 1200,
  },
})
