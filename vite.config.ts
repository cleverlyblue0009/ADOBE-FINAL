import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Plugin to copy PDF.js worker files to public directory
    {
      name: 'copy-pdf-worker',
      generateBundle() {
        // This will be handled by the assetsInclude and optimizeDeps configuration
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  assetsInclude: ['**/*.worker.js', '**/*.worker.min.js', '**/*.worker.mjs', '**/*.worker.min.mjs'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist']
        }
      }
    }
  },
  define: {
    // Help with PDF.js worker path resolution
    'process.env': {}
  }
}));
