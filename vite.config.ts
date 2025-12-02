import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      // Istruisce Vite a non includere queste librerie nel bundle finale.
      // Il browser le caricherà tramite la <script type="importmap"> definita in index.html.
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
