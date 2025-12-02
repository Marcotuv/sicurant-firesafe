
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      // Escludiamo dal bundle le librerie presenti nell'importmap (index.html)
      // Questo previene l'errore "failed to resolve" durante la build
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'lucide-react',
        'recharts',
        '@supabase/supabase-js'
      ]
    }
  }
});
