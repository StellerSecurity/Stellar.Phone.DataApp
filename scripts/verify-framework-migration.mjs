import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const failures = [];

// Angular 22 uses the 2026-05-07 Baseline browser set. A stale parent/global
// Browserslist (for example Chrome 79 / iOS 14) makes esbuild 0.28 attempt a
// destructuring transform it intentionally does not implement. Pin the project
// to Angular's supported Baseline so builds are deterministic regardless of
// the directory the repo is unpacked into.
const browserslistPath = join(root, '.browserslistrc');
let browserslist = '';
try {
  browserslist = readFileSync(browserslistPath, 'utf8');
} catch {
  failures.push('.browserslistrc is required to isolate Angular 22 from stale parent/global browser targets.');
}
if (browserslist && !browserslist.includes('baseline widely available on 2026-05-07')) {
  failures.push('.browserslistrc must target Angular 22 Baseline: baseline widely available on 2026-05-07');
}
if (process.env.BROWSERSLIST) {
  failures.push('BROWSERSLIST environment variable is set and can override the project browser baseline; unset it before building.');
}

const expected = [
  ['dependencies', '@ionic/angular', 9],
  ['dependencies', '@capacitor/core', 8],
  ['dependencies', '@capacitor/android', 8],
  ['dependencies', '@capacitor/ios', 8],
  ['dependencies', '@angular/core', 22],
  ['dependencies', '@ngx-translate/core', 18],
];

for (const [section, name, major] of expected) {
  const value = packageJson[section]?.[name];
  if (!value || !new RegExp(`(?:\\^|~|>=|=)?${major}(?:\\.|$)`).test(value)) {
    failures.push(`${name} must remain on major ${major}; found ${value ?? 'missing'}`);
  }
}

const forbidden = [
  ['@ionic/angular/standalone', 'Ionic 9 exposes standalone APIs from @ionic/angular'],
  ['IonicModule', 'IonicModule is not used by the Ionic 9 standalone integration'],
  ['TranslateModule', 'ngx-translate 18 removed TranslateModule'],
  ['setDefaultLang(', 'ngx-translate 18 renamed setDefaultLang() to setFallbackLang()'],
  ['CommonEngine', 'Angular 22 SSR uses AngularNodeAppEngine in this project'],
];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }

    if (!/\.(?:ts|html)$/.test(entry)) continue;
    const text = readFileSync(full, 'utf8');
    for (const [needle, reason] of forbidden) {
      if (text.includes(needle)) {
        failures.push(`${relative(root, full)} contains ${needle}: ${reason}`);
      }
    }
  }
}

walk(join(root, 'src'));

for (const rootFile of ['server.ts', 'capacitor.config.ts']) {
  const full = join(root, rootFile);
  const text = readFileSync(full, 'utf8');
  for (const [needle, reason] of forbidden) {
    if (text.includes(needle)) {
      failures.push(`${rootFile} contains ${needle}: ${reason}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Framework migration verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Framework migration verification passed.');
console.log('Angular 22 / Ionic 9 / Capacitor 8 / ngx-translate 18 source invariants are clean.');
