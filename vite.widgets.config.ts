import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  build: {
    outDir: 'dist/widgets',
    lib: {
      entry: resolve(__dirname, 'src/widgets/index.ts'),
      formats: ['es'],
      fileName: (format) => `widgets.${format}.js`,
    },
    rollupOptions: {
      input: {
        SlotCards: resolve(__dirname, 'src/widgets/SlotCards/index.tsx'),
        SearchForm: resolve(__dirname, 'src/widgets/SearchForm/index.tsx'),
        WeeklyCalendar: resolve(__dirname, 'src/widgets/WeeklyCalendar/index.tsx'),
        PriceComparison: resolve(__dirname, 'src/widgets/PriceComparison/index.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      external: [],
    },
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: false,
    // Bundle size budget: 200KB per widget
    chunkSizeWarningLimit: 200,
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
