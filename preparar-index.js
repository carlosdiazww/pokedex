#!/usr/bin/env node
/**
 * preparar-index.js
 * Limpia el index.html que genera `ng build` para que cumpla una
 * Content-Security-Policy estricta (script-src 'self' sin 'unsafe-inline').
 * Solo toca el archivo compilado en dist/; el código fuente queda intacto.
 *
 *  1. Quita el <script> inline "Single Page Apps for GitHub Pages".
 *     En Azure Static Web Apps las rutas de la SPA se resuelven con
 *     navigationFallback (staticwebapp.config.json), así que no hace falta.
 *  2. Quita media="print" onload="this.media='all'" que Angular agrega a la
 *     hoja de estilos (CSS crítico). Ese onload es JavaScript inline y la CSP
 *     lo bloquearía, dejando la página sin estilos.
 *
 * Uso: node preparar-index.js [ruta/al/index.html]
 */
const fs = require('fs');

const file = process.argv[2] || 'dist/pokedex-angular/index.html';
let html = fs.readFileSync(file, 'utf8');
const before = html;

html = html.replace(
  /\s*<!-- Start Single Page Apps for GitHub Pages -->[\s\S]*?<!-- End Single Page Apps for GitHub Pages -->/,
  ''
);
html = html.replace(/\s+media="print"\s+onload="this\.media='all'"/g, '');

if (html !== before) {
  fs.writeFileSync(file, html);
  console.log(`[preparar-index] ${file} ajustado para la CSP.`);
} else {
  console.log(`[preparar-index] ${file} no requería cambios.`);
}

// Validación: si queda JavaScript inline, el build falla para no publicar algo roto.
const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>/i.test(html);
const inlineHandler = /\son[a-z]+\s*=/i.test(html);
if (inlineScript || inlineHandler) {
  console.error('[preparar-index] ERROR: aún hay JavaScript inline en el index.html.');
  process.exit(1);
}
