// Uso: node diag.mjs http://127.0.0.1:8000
const base = process.argv[2];
const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
const t = async (nombre, fn) => { const r = []; for (let i = 0; i < 6; i++) { const a = performance.now(); const x = await fn(); r.push(+(performance.now() - a).toFixed(0)); if (i === 0) var st = x; } console.log(nombre.padEnd(34), 'estado', st, '| ms por petición:', r.join(', ')); };
await t('GET /up (arranque del framework)', async () => (await fetch(base + '/up')).status);
await t('GET /api/cursos sin token (401)', async () => (await fetch(base + '/api/cursos', { headers: J })).status);
let token;
await t('POST /api/login', async () => { const r = await fetch(base + '/api/login', { method: 'POST', headers: J, body: JSON.stringify({ email: 'admin@comparativo.test', password: 'Clave1234' }) }); token = (await r.json()).token ?? token; return r.status; });
await t('GET /api/cursos con token', async () => (await fetch(base + '/api/cursos?page=1&per_page=10', { headers: { ...J, Authorization: `Bearer ${token}` } })).status);
const r = await fetch(base + '/up'); console.log('Connection:', r.headers.get('connection'), '| X-Powered-By:', r.headers.get('x-powered-by'));
