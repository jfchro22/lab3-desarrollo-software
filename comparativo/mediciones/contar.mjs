// Uso (desde la raíz del repo): node comparativo/mediciones/contar.mjs
import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const lineas = (t) => t.split(/\r?\n/).filter((l) => l.trim() !== '').length;
const leer = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const region = (t, tag) => { const re = new RegExp(`\\[${tag}:inicio\\][\\s\\S]*?\\[${tag}:fin\\]`, 'g'); return (t.match(re) ?? []).map((x) => x.split('\n').slice(1, -1).join('\n')).join('\n'); };
const walk = (d, ext, out = []) => { for (const e of readdirSync(d)) { if (['node_modules', 'dist', 'bin', 'obj'].includes(e)) continue; const p = join(d, e); statSync(p).isDirectory() ? walk(p, ext, out) : ext.some((x) => p.endsWith(x)) && out.push(p); } return out; };
const sumar = (files) => ({ archivos: files.filter(existsSync).length, lineas: files.reduce((a, f) => a + lineas(leer(f)), 0) });

const R = {};
const L = 'app/';
const lv = { porcion: [`${L}Http/Controllers/AuthController.php`, `${L}Http/Controllers/CursoController.php`, `${L}Http/Requests/LoginRequest.php`, `${L}Http/Requests/StoreCursoRequest.php`, `${L}Http/Requests/UpdateCursoRequest.php`, `${L}Http/Requests/ListarCursosRequest.php`, `${L}Http/Resources/CursoResource.php`, `${L}Http/Resources/UserResource.php`, `${L}Http/Resources/ProfesorResource.php`, `${L}Http/Resources/CategoriaResource.php`, `${L}Models/Curso.php`, `${L}Models/Profesor.php`, `${L}Models/Categoria.php`, `${L}Models/User.php`, `${L}Policies/CursoPolicy.php`, `${L}Repositories/CursoRepository.php`, `${L}Repositories/EloquentCursoRepository.php`, `${L}Services/CursoService.php`, `${L}Services/AuthService.php`, `${L}Services/Concerns/AutorizaAcciones.php`, `${L}Exceptions/BusinessRuleException.php`, `${L}Http/Middleware/EnsureUserHasRole.php`, 'routes/api.php', 'bootstrap/app.php'],
  validacion: [`${L}Http/Requests/LoginRequest.php`, `${L}Http/Requests/StoreCursoRequest.php`, `${L}Http/Requests/UpdateCursoRequest.php`, `${L}Http/Requests/ListarCursosRequest.php`],
  auth: [`${L}Http/Controllers/AuthController.php`, `${L}Services/AuthService.php`, `${L}Http/Resources/UserResource.php`] };
R.laravel = { porcion: sumar(lv.porcion), validacion: sumar(lv.validacion), autenticacion: sumar(lv.auth), documentacion: { lineas_docblock_controladores: [`${L}Http/Controllers/CursoController.php`, `${L}Http/Controllers/AuthController.php`].reduce((a, f) => a + leer(f).split('\n').filter((l) => /^\s*\*\s?\S/.test(l)).length, 0), paquete: 'dedoc/scramble (generación automática)' }, dependencias_auth: ['laravel/sanctum'] };

const nz = 'comparativo/nestjs';
const nfiles = walk(`${nz}/src`, ['.ts']);
const nval = region(nfiles.map(leer).join('\n'), 'validacion');
R.nestjs = { porcion: sumar(nfiles), validacion: { archivos: 2, lineas: lineas(leer(`${nz}/src/cursos/dto.ts`)) + lineas(leer(`${nz}/src/errores.ts`)) + lineas(nval) }, autenticacion: { archivos: 2, lineas: lineas(leer(`${nz}/src/auth/auth.controller.ts`)) + lineas(leer(`${nz}/src/auth/auth.guard.ts`)) + lineas(region(leer(`${nz}/src/app.module.ts`), 'auth')) }, documentacion: { lineas: lineas(leer(`${nz}/src/app.setup.ts`)) + 2, paquete: '@nestjs/swagger' }, dependencias_auth: ['@nestjs/jwt', 'bcryptjs'] };

const ap = 'comparativo/aspnet/Comparativo.Api';
const afiles = walk(ap, ['.cs']);
const prog = leer(`${ap}/Program.cs`);
R.aspnet = { porcion: sumar(afiles), validacion: { archivos: 2, lineas: lineas(leer(`${ap}/Dtos.cs`)) + lineas(region(leer(`${ap}/Controllers/CursosController.cs`), 'validacion')) + 6 }, autenticacion: { archivos: 2, lineas: lineas(leer(`${ap}/Controllers/AuthController.cs`)) + lineas(region(prog, 'auth')) }, documentacion: { lineas: lineas(region(prog, 'docs')), paquete: 'Swashbuckle.AspNetCore' }, dependencias_auth: ['Microsoft.AspNetCore.Authentication.JwtBearer', 'BCrypt.Net-Next'] };
writeFileSync('comparativo/resultados/lineas.json', JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));
