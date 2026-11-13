// Uso (desde la raíz del repo): node comparativo/mediciones/tiempos.mjs <laravel|nestjs|aspnet>
// Mide: puesta en marcha en frío (instalar dependencias + compilar), duración de las 3 pruebas y tamaño del artefacto.
import { execSync } from 'node:child_process';
import { rmSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const fw = process.argv[2];
const dirSize = (d) => { if (!existsSync(d)) return 0; let t = 0; for (const e of readdirSync(d)) { const p = join(d, e); const s = statSync(p); t += s.isDirectory() ? dirSize(p) : s.size; } return t; };
const mb = (b) => +(b / 2 ** 20).toFixed(1);
const run = (cmd, cwd = '.') => { const t = performance.now(); execSync(cmd, { cwd, stdio: 'inherit' }); return +((performance.now() - t) / 1000).toFixed(1); };
const R = { framework: fw, fecha: new Date().toISOString() };
if (fw === 'nestjs') {
  const c = 'comparativo/nestjs';
  rmSync(`${c}/node_modules`, { recursive: true, force: true }); rmSync(`${c}/dist`, { recursive: true, force: true });
  R.puesta_en_marcha_s = +(run('npm ci --no-audit --no-fund', c) + run('npm run build', c)).toFixed(1);
  R.pruebas_s = run('npm test', c);
  execSync('npm prune --omit=dev --no-audit --no-fund', { cwd: c, stdio: 'ignore' });
  R.artefacto_mb = mb(dirSize(`${c}/dist`) + dirSize(`${c}/node_modules`));
  R.artefacto_detalle = 'dist + node_modules de producción (sin runtime Node)';
} else if (fw === 'aspnet') {
  const c = 'comparativo/aspnet';
  for (const d of ['Comparativo.Api', 'Comparativo.Tests']) { rmSync(`${c}/${d}/bin`, { recursive: true, force: true }); rmSync(`${c}/${d}/obj`, { recursive: true, force: true }); }
  R.puesta_en_marcha_s = +(run('dotnet restore', `${c}/Comparativo.Api`) + run('dotnet build -c Release --no-restore', `${c}/Comparativo.Api`)).toFixed(1);
  R.pruebas_s = run('dotnet test', `${c}/Comparativo.Tests`);
  rmSync(`${c}/publicado`, { recursive: true, force: true });
  execSync('dotnet publish -c Release -o ../publicado', { cwd: `${c}/Comparativo.Api`, stdio: 'ignore' });
  R.artefacto_mb = mb(dirSize(`${c}/publicado`));
  R.artefacto_detalle = 'dotnet publish (dependiente del framework, sin runtime)';
  rmSync(`${c}/publicado`, { recursive: true, force: true });
} else if (fw === 'laravel') {
  rmSync('vendor', { recursive: true, force: true });
  R.puesta_en_marcha_s = run('composer install --no-interaction --prefer-dist');
  R.pruebas_s = run('php artisan test --filter=ComparativoContratoTest');
  R.artefacto_mb = mb(['app', 'bootstrap', 'config', 'database', 'public', 'resources', 'routes', 'vendor'].reduce((a, d) => a + dirSize(d), 0));
  R.artefacto_detalle = 'app, bootstrap, config, database, public, resources, routes y vendor (incluye dependencias de desarrollo; sin runtime PHP)';
} else { console.error('framework no válido'); process.exit(1); }
mkdirSync('comparativo/resultados', { recursive: true });
writeFileSync(`comparativo/resultados/tiempos-${fw}.json`, JSON.stringify(R, null, 2));
console.log(R);
