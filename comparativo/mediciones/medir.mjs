// Uso: node medir.mjs <nombre> <baseUrl> <puerto> <urlOpenApi> [vus=20] [segundos=30]
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
const [nombre, base, puerto, oaUrl, vus = '20', seg = '30'] = process.argv.slice(2);
const out = { nombre, fecha: new Date().toISOString(), maquina: `${os.cpus()[0].model} x${os.cpus().length}, ${Math.round(os.totalmem()/2**30)} GB, ${os.platform()}`, node: process.version };
const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
const call = async (m, p, body, token, extra = {}) => {
  const r = await fetch(base + p, { method: m, headers: { ...J, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j, h: r.headers };
};
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

// 1. Memoria (pid que escucha en el puerto)
function memoriaMB() {
  try {
    if (os.platform() === 'win32') {
      const v = execSync(`powershell -NoProfile -Command "(Get-Process -Id (Get-NetTCPConnection -LocalPort ${puerto} -State Listen | Select-Object -First 1).OwningProcess).WorkingSet64"`).toString().trim();
      return +(Number(v) / 2**20).toFixed(1);
    }
    const pid = execSync(`ss -ltnp | grep ':${puerto} ' | sed -E 's/.*pid=([0-9]+).*/\\1/' | head -1`).toString().trim();
    return +(Number(execSync(`awk '/VmRSS/ {print $2}' /proc/${pid}/status`).toString()) / 1024).toFixed(1);
  } catch (e) { return null; }
}
out.memoria_reposo_mb = memoriaMB();

// 2. Contrato
const checks = [];
const ok = (desc, cond) => checks.push({ desc, ok: !!cond });
const L = await call('POST', '/api/login', { email: 'admin@comparativo.test', password: 'Clave1234' });
ok('POST /api/login válido → 200 con token', L.s === 200 && L.j?.token);
const T = L.j?.token;
ok('POST /api/login clave incorrecta → 401', (await call('POST', '/api/login', { email: 'admin@comparativo.test', password: 'mala' })).s === 401);
ok('POST /api/login datos inválidos → 422', (await call('POST', '/api/login', { email: 'x' })).s === 422);
ok('GET /api/cursos sin token → 401', (await call('GET', '/api/cursos')).s === 401);
const li = await call('GET', '/api/cursos?page=2&per_page=10', null, T);
ok('GET /api/cursos → 200 con data y meta (current_page=2, per_page=10)', li.s === 200 && Array.isArray(li.j?.data) && li.j.meta?.current_page === 2 && li.j.meta?.per_page === 10 && li.j.data.length === 10);
ok('item con id, nombre, creditos, profesor_id', ['id', 'nombre', 'creditos', 'profesor_id'].every((k) => k in (li.j?.data?.[0] ?? {})));
const id1 = li.j?.data?.[0]?.id;
ok('GET /api/cursos/{id} → 200', (await call('GET', `/api/cursos/${id1}`, null, T)).s === 200);
ok('GET /api/cursos/99999999 → 404', (await call('GET', '/api/cursos/99999999', null, T)).s === 404);
const prof = (await call('GET', '/api/cursos?per_page=1', null, T)).j?.data?.[0]?.profesor_id;
const nombre1 = `Curso medicion ${Date.now()}`;
const cr = await call('POST', '/api/cursos', { nombre: nombre1, creditos: 3, profesor_id: prof, categoria_ids: [1] }, T);
ok('POST /api/cursos válido → 201 con Location', cr.s === 201 && /\/api\/cursos\/\d+$/.test(cr.h.get('location') ?? ''));
const nid = cr.j?.data?.id;
const inv = await call('POST', '/api/cursos', { nombre: 'x', creditos: 9 }, T);
ok('POST /api/cursos inválido → 422 con errors por campo', inv.s === 422 && inv.j?.errors?.nombre && inv.j?.errors?.creditos);
ok('PUT /api/cursos/{id} → 200', (await call('PUT', `/api/cursos/${nid}`, { nombre: nombre1, creditos: 4, profesor_id: prof, categoria_ids: [1] }, T)).s === 200);
ok('PUT inexistente → 404', (await call('PUT', '/api/cursos/99999999', { nombre: 'Inexistente', creditos: 4, profesor_id: prof, categoria_ids: [1] }, T)).s === 404);
ok('PUT inválido → 422', (await call('PUT', `/api/cursos/${nid}`, { nombre: nombre1, creditos: 99, profesor_id: prof, categoria_ids: [1] }, T)).s === 422);
ok('DELETE /api/cursos/{id} → 204', (await call('DELETE', `/api/cursos/${nid}`, null, T)).s === 204);
ok('DELETE inexistente → 404', (await call('DELETE', '/api/cursos/99999999', null, T)).s === 404);
out.contrato = { cumplidos: checks.filter((c) => c.ok).length, total: checks.length, detalle: checks };

// 3. Sonda de seguridad por omisión
const sec = {};
const h = L.h;
sec.cabeceras = Object.fromEntries(['x-powered-by', 'server', 'x-content-type-options', 'x-frame-options', 'strict-transport-security', 'content-security-policy'].map((k) => [k, h.get(k) ?? null]));
const pre = await fetch(base + '/api/cursos', { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET' } });
sec.cors_acao_origen_ajeno = pre.headers.get('access-control-allow-origin');
let s429 = false; for (let i = 0; i < 8; i++) if ((await call('POST', '/api/login', { email: 'admin@comparativo.test', password: 'mala' + i })).s === 429) s429 = true;
sec.limitacion_intentos_login_429 = s429;
const mal = await fetch(base + '/api/login', { method: 'POST', headers: J, body: '{"email": ' });
const malTxt = await mal.text();
sec.json_malformado = { status: mal.status, filtra_traza: /Stack|\.php|\.cs:|at .*\(.*:\d+|Exception/i.test(malTxt) };
sec.inyeccion_sql_en_filtro_status = (await call('GET', "/api/cursos?nombre=' OR 1=1 --", null, T)).s;
sec.token_alterado_status = (await call('GET', '/api/cursos', null, (T ?? 'a.b.c') + 'x')).s;
const ma = await call('POST', '/api/cursos', { id: 987654, nombre: `Mass ${Date.now()}`, creditos: 2, profesor_id: prof, categoria_ids: [1] }, T);
sec.asignacion_masiva_id_ignorado = ma.j?.data?.id !== 987654;
if (ma.j?.data?.id) await call('DELETE', `/api/cursos/${ma.j.data.id}`, null, T);
out.seguridad = sec;
if (L.s === 200) { /* el 429 de la sonda no debe afectar la carga: login nuevo tras la sonda */ }

// 4. Carga (bucle cerrado, mismo escenario para los tres)
await new Promise((r) => setTimeout(r, s429 ? 65000 : 1500)); // si hubo bloqueo por intentos, esperar a que expire
const T2 = (await call('POST', '/api/login', { email: 'admin@comparativo.test', password: 'Clave1234' })).j?.token ?? T;
const lat = []; let errores = 0; let corriendo = true;
const worker = async () => { while (corriendo) { const t = performance.now(); try { const r = await fetch(base + '/api/cursos?page=1&per_page=10', { headers: { ...J, Authorization: `Bearer ${T2}` } }); await r.arrayBuffer(); if (r.status !== 200) errores++; } catch { errores++; } lat.push(performance.now() - t); } };
const lanzar = (s) => { corriendo = true; const w = Array.from({ length: +vus }, worker); return new Promise((res) => setTimeout(async () => { corriendo = false; await Promise.all(w); res(); }, s * 1000)); };
await lanzar(5); lat.length = 0; errores = 0; // calentamiento descartado
const t0 = performance.now(); await lanzar(+seg); const dur = (performance.now() - t0) / 1000;
out.carga = { vus: +vus, segundos: +seg, peticiones: lat.length, errores, rps: +(lat.length / dur).toFixed(1), p50_ms: +pct(lat, 0.5).toFixed(2), p95_ms: +pct(lat, 0.95).toFixed(2), p99_ms: +pct(lat, 0.99).toFixed(2) };
out.memoria_tras_carga_mb = memoriaMB();

// 5. OpenAPI
try {
  const doc = /^https?:/.test(oaUrl) ? await (await fetch(oaUrl)).json() : JSON.parse(readFileSync(oaUrl, 'utf8'));
  const ops = []; for (const [p, m] of Object.entries(doc.paths ?? {})) for (const [v, o] of Object.entries(m)) if (['get', 'post', 'put', 'patch', 'delete'].includes(v) && (/login|cursos/.test(p))) ops.push({ v: v.toUpperCase(), p, codigos: Object.keys(o.responses ?? {}), seguridad: !!(o.security?.length) });
  out.openapi = { operaciones_login_cursos: ops.length, schemas: Object.keys(doc.components?.schemas ?? {}).length, codigos_documentados: ops.reduce((a, o) => a + o.codigos.length, 0), operaciones: ops };
} catch (e) { out.openapi = { error: String(e) }; }

mkdirSync('../resultados', { recursive: true });
writeFileSync(`../resultados/${nombre}.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ contrato: `${out.contrato.cumplidos}/${out.contrato.total}`, fallidos: checks.filter((c) => !c.ok).map((c) => c.desc), carga: out.carga, mem: [out.memoria_reposo_mb, out.memoria_tras_carga_mb], seguridad: sec, openapi: { ops: out.openapi.operaciones_login_cursos, schemas: out.openapi.schemas, codigos: out.openapi.codigos_documentados } }, null, 1));
