import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ─── TOKEN BUBBLE ─────────────────────────────────────────────────────────────
// Version test  → Bearer test_f92090a3c34a5a84387182092bf29434
// Version live  → Bearer live_xxx  (à remplacer avant déploiement)
const BUBBLE_TOKEN = "cc183f014a27af5df2c6f6b14d0a44ee";
const BUBBLE_BASE  = "https://portail-qualidal.com/version-test/api/1.1";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Toutes les requêtes /api/bubble?table=XXX&cursor=YYY&constraints=ZZZ
      // sont redirigées vers Bubble avec le token Bearer injecté automatiquement
      '/api/bubble': {
        target: BUBBLE_BASE,
        changeOrigin: true,
        // Réécrit /api/bubble?table=companies&cursor=0 → /obj/companies?cursor=0
        rewrite: (path) => {
          const url  = new URL(path, 'http://localhost');
          const table       = url.searchParams.get('table') || '';
          const cursor      = url.searchParams.get('cursor') || '0';
          const constraints = url.searchParams.get('constraints') || '';
          let newPath = `/obj/${table}?cursor=${cursor}&limit=100`;
          if (constraints) newPath += `&constraints=${constraints}`;
          return newPath;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${BUBBLE_TOKEN}`);
          });
        },
      },
    },
  },
})
