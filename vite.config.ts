import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MarkdownDocsViewer',
      formats: ['es', 'umd'],
      fileName: format => (format === 'umd' ? 'index.umd.cjs' : `index.${format}.js`),
    },
    rollupOptions: {
      external: ['marked', 'marked-highlight', 'highlight.js'],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.es.js',
        },
        {
          format: 'umd',
          name: 'MarkdownDocsViewer',
          entryFileNames: 'index.umd.cjs',
          globals: {
            marked: 'marked',
            'marked-highlight': 'markedHighlight',
            'highlight.js': 'hljs',
          },
          // Ensure proper handling of ESM dependencies in UMD builds
          interop: 'compat',
        },
      ],
    },
    sourcemap: true,
    minify: true,
  },
  server: {
    port: 5000,
  },
});
