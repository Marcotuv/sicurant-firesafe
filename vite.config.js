
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true, // Abilitato per debugging in produzione se necessario
    emptyOutDir: true,
    minify: 'terser', // Ottimizzazione minificazione
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunking strategico per cache optimization
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'recharts', 'react-window'],
          'data-vendor': ['@supabase/supabase-js', 'idb-keyval', 'zod']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
