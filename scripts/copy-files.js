#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Ensure dist directories exist
const dirs = [
  'dist',
  'dist/react',
  'dist/vue',
  'dist/astro'
];

dirs.forEach(dir => {
  const fullPath = join(rootDir, dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }
});

// Copy Vue component file (it's already compiled as a .vue file)
const vueSource = join(rootDir, 'src/vue/index.vue');
const vueDest = join(rootDir, 'dist/vue/index.vue');
if (existsSync(vueSource)) {
  copyFileSync(vueSource, vueDest);
  console.log('Copied Vue component');
}

// Copy Astro component file
const astroSource = join(rootDir, 'src/astro/index.astro');
const astroDest = join(rootDir, 'dist/astro/index.astro');
if (existsSync(astroSource)) {
  copyFileSync(astroSource, astroDest);
  console.log('Copied Astro component');
}

// Copy Astro animation script
const astroScriptSource = join(rootDir, 'src/astro/AnimationScript.ts');
const astroScriptDest = join(rootDir, 'dist/astro/AnimationScript.js');
if (existsSync(astroScriptSource)) {
  // Note: This should be compiled by TypeScript, not just copied
  // The .js version will be created by tsc
  console.log('Astro AnimationScript will be compiled by TypeScript');
}

console.log('File copying completed');