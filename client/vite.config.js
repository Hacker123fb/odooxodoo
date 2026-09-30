import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('react-hook-form')) {
              return 'vendor-forms';
            }
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) {
              return 'vendor-react';
            }
            return 'vendor-shared';
          }
        }
      }
    }
  }
});
