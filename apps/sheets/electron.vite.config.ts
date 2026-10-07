import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    // @alternateoffice/* workspace packages ship TS source (no build step, no
    // compiled entry point) — externalizing them makes Node's ESM loader try
    // to resolve their relative imports at runtime and fail. Bundle those;
    // externalize everything else (Electron, zod, node builtins).
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          '@alternateoffice/ai-provider',
          '@alternateoffice/agent-core',
          '@alternateoffice/ai-search',
          '@alternateoffice/docx-engine',
          '@alternateoffice/file-parse',
          '@alternateoffice/electron-utils',
          '@alternateoffice/i18n',
          '@alternateoffice/pptx-render',
          '@alternateoffice/xlsx-gateway',
        ],
      }),
    ],
  },
  preload: {
    // Sandboxed preload scripts cannot require arbitrary npm packages at
    // runtime, so the drop-open bridge must be bundled, not externalized.
    plugins: [externalizeDepsPlugin({ exclude: ['@alternateoffice/electron-utils'] })],
  },
  renderer: {
    plugins: [react()],
  },
})
