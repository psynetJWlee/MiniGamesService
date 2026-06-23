import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Copy the built index.html to 404.html so GitHub Pages serves the SPA shell
// for deep links / refreshes (e.g. /MiniGamesService/game/feeding) instead of
// returning its own 404 page.
function spaPagesFallback() {
  return {
    name: 'spa-pages-fallback',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      const index = path.join(dist, 'index.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.join(dist, '404.html'))
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  // Served from a repo subpath on GitHub Pages (build), but from root locally (dev).
  base: command === 'build' ? '/MiniGamesService/' : '/',
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    spaPagesFallback(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Honor the PORT env var when provided (e.g. by preview tooling), else 5173.
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
}))
