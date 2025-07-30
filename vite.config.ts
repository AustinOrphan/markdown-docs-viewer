import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ include: ['src'] })],
  optimizeDeps: {
    exclude: ['marked', 'marked-highlight', 'highlight.js'],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MarkdownDocsViewer',
      formats: ['es', 'umd'],
      fileName: 'markdown-docs-viewer',
    },
    rollupOptions: {
      external: ['marked', 'marked-highlight', 'highlight.js'],
      output: {
        globals: {
          marked: 'marked',
          'marked-highlight': 'markedHighlight',
          'highlight.js': 'hljs',
        },
      },
    },
    sourcemap: true,
    minify: true,
  },
  server: {
    port: 5000,
  },
});
