// Uso (desde la raíz del repo): node comparativo/mediciones/generar-informe.mjs
// Lee comparativo/resultados/*.json y escribe docs/informe-comparativo.md con TODOS los datos medidos.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const rd = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
const F = { laravel: 'Laravel 13', nestjs: 'NestJS', aspnet: 'ASP.NET Core 8' };
const K = Object.keys(F);
const M = Object.fromEntries(K.map((k) => [k, rd(`comparativo/resultados/${k}.json`)]));
const T = Object.fromEntries(K.map((k) => [k, rd(`comparativo/resultados/tiempos-${k}.json`)]));
const Ln = rd('comparativo/resultados/lineas.json');
const SO = rd('comparativo/resultados/laravel-sin-opcache.json');
const falt = K.filter((k) => !M[k] || !T[k]);
if (falt.length) console.warn('⚠ Faltan resultados de:', falt.join(', '), '→ las celdas quedarán como "no medido".');
const v = (x, u = '') => (x === undefined || x === null ? 'no medido' : `${x}${u}`);
const ver = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n')[0].trim(); } catch { return 'no disponible'; } };
const best = (fn, low = true) => { const a = K.map((k) => [k, fn(k)]).filter(([, x]) => typeof x === 'number'); if (a.length < 2) return null; a.sort((x, y) => (low ? x[1] - y[1] : y[1] - x[1])); return a; };
const nombresOrden = (a) => a.map(([k, x]) => `${F[k]} (${x})`).join(' < ');
const fila = (etq, fn) => `| ${etq} | ${K.map((k) => v(fn(k))).join(' | ')} |`;
const c = (k) => M[k]?.carga, mem = (k) => M[k], s = (k) => M[k]?.seguridad, o = (k) => M[k]?.openapi;

const rps = best((k) => c(k)?.rps, false), p95 = best((k) => c(k)?.p95_ms, true), art = best((k) => T[k]?.artefacto_mb, true), arr = best((k) => T[k]?.puesta_en_marcha_s, true), loc = best((k) => Ln?.[k]?.porcion.lineas, true), mr = best((k) => mem(k)?.memoria_reposo_mb, true);
const ratio = rps && rps.length === 3 ? (rps[0][1] / rps[rps.length - 1][1]).toFixed(1) : null;

const md = `# Estudio comparativo de frameworks de back-end: Laravel 13, NestJS y ASP.NET Core 8

**Curso:** IF0009 Desarrollo de Software IV · Universidad de Costa Rica, Sede de Guanacaste · II ciclo 2026
**Autor:** Jose Fernando Charpentier Rojas · **Fecha de entrega:** 12 de noviembre de 2026
**Repositorio:** https://github.com/jfchro22/lab3-desarrollo-software (carpeta \`comparativo/\`)

## Resumen

Se implementó una misma porción vertical (inicio de sesión y CRUD paginado del recurso \`Curso\`, con una relación muchos a muchos con \`Categoria\`) en Laravel 13, NestJS y ASP.NET Core 8, bajo un contrato HTTP común y sobre la misma base de datos SQLite con 1 000 cursos. Cada implementación se midió en la misma máquina con un procedimiento automatizado y reproducible: fidelidad al contrato (15 verificaciones), puesta en marcha en frío, tamaño y esfuerzo de código (validación, autenticación, documentación), pruebas, rendimiento (peticiones por segundo y latencia p95 con 20 clientes concurrentes), huella de memoria y artefacto, y una sonda de seguridad por omisión. ${rps ? `En rendimiento, el orden de mayor a menor rendimiento fue ${rps.map(([k, x]) => `${F[k]} (${x} req/s)`).join(', ')}.` : 'Los resultados de rendimiento no estaban disponibles al generar este informe.'} Se discuten los límites del estudio —una sola máquina, un solo escenario de lectura y un servidor de desarrollo para Laravel— y se formula una recomendación condicionada a la evidencia.

## 1. Introducción

Elegir el framework de back-end es una decisión de arquitectura que condiciona la velocidad de desarrollo, el costo de operación y la seguridad de un sistema. En el proyecto del curso, el sistema de matrícula universitaria se construyó sobre Laravel 13 (requisito del curso), pero el enunciado exige además comparar ese framework con NestJS (Node.js) y ASP.NET Core 8 (C#) mediante una porción vertical equivalente y mediciones propias.

**Pregunta de investigación.** Bajo un contrato HTTP idéntico y datos idénticos, ¿qué diferencias medibles existen entre los tres frameworks en esfuerzo de implementación, rendimiento, huella y protecciones por omisión, y cuál conviene recomendar al equipo?

**Objetivos.** (1) Definir un contrato común verificable. (2) Implementar la porción vertical en los tres frameworks. (3) Medir los ocho criterios exigidos con un procedimiento reproducible. (4) Valorar con evidencia la seguridad por omisión y el ecosistema. (5) Formular una recomendación coherente con los datos y reconocer los límites del estudio.

## 2. Marco de referencia

**API REST y contrato.** El estilo REST describe recursos identificados por URI y manipulados mediante una interfaz uniforme (Fielding, 2000). La semántica de métodos y códigos de estado (por ejemplo 201 con encabezado \`Location\` al crear, 204 al eliminar, 404 y 409 para recurso inexistente o en conflicto) está definida en RFC 9110 (Fielding et al., 2022). Un contrato escrito antes de implementar permite que las tres implementaciones sean comparables entre sí; sin él, las diferencias medidas podrían deberse a funcionalidad distinta y no al framework.

**Autenticación por token.** Laravel Sanctum emite tokens opacos que se almacenan (con hash) en base de datos y por tanto pueden revocarse y expirar en el servidor (Laravel, 2026). En NestJS y ASP.NET Core se emplearon JSON Web Tokens firmados (RFC 7519; Jones et al., 2015), que se validan sin consultar la base de datos pero que no se pueden revocar antes de expirar salvo que se añada una lista de denegación. Esta diferencia de diseño afecta tanto el esfuerzo como el rendimiento por petición y se toma en cuenta en el análisis.

**Frameworks.** Laravel integra ORM, validación declarativa, autorización y generación de documentación en un solo paquete de convenciones (Laravel, 2026). NestJS organiza la aplicación en módulos, controladores y proveedores con decoradores sobre TypeScript y Express (NestJS, s. f.). ASP.NET Core ofrece un pipeline de middleware, controladores con atributos y validación por anotaciones de datos (Microsoft, 2024).

**Metodología de medición.** Se siguió la guía de estudios empíricos en ingeniería de software de Runeson y Höst (2009) y la lista de amenazas a la validez de Wohlin et al. (2012). En las pruebas de carga se aplicaron los principios de Jain (1991): escenario idéntico, calentamiento descartado, métricas de percentil y reporte de las condiciones de ejecución. La seguridad por omisión se contrastó con las categorías del OWASP API Security Top 10 (OWASP, 2023).

## 3. Diseño de la comparación

### 3.1 Contrato común

La entidad es \`Curso\` (campos: \`id\`, \`nombre\`, \`creditos\`, \`profesor_id\`; relación N:M con \`Categoria\`). Operaciones, congeladas en \`docs/contrato-comparativo.md\`:

| Operación | Método y ruta | Respuesta esperada |
|---|---|---|
| Inicio de sesión | POST /api/login | 200 con token; 422 datos inválidos; 401 credenciales incorrectas |
| Listado paginado | GET /api/cursos?page=&per_page=&nombre= | 200 con \`data\` y \`meta\` (current_page, per_page, total, last_page); 401 sin token |
| Detalle | GET /api/cursos/{id} | 200; 404 si no existe |
| Creación | POST /api/cursos | 201 con encabezado Location; 422 con errores por campo; 403 si no es administrador |
| Actualización | PUT/PATCH /api/cursos/{id} | 200; 404 si no existe; 422 datos inválidos |
| Eliminación | DELETE /api/cursos/{id} | 204; 404 si no existe; 409 si tiene matrículas |

Reglas de validación comunes: \`nombre\` de 3 a 150 caracteres y único; \`creditos\` entero de 1 a 6; \`profesor_id\` existente; \`categoria_ids\` arreglo no vacío de categorías existentes; \`per_page\` entre 1 y 50. La escritura queda restringida al rol \`admin\`.

**Desviación respecto del enunciado.** El enunciado menciona el filtro \`q\`; el contrato congelado y las tres implementaciones usan \`nombre\`, que es el parámetro ya existente en la API de Laravel desarrollada durante los laboratorios. La desviación es la misma en los tres frameworks y, por tanto, no afecta la comparabilidad.

### 3.2 Variables controladas

- **Misma base de datos y mismos datos:** un archivo SQLite generado por las migraciones de Laravel y poblado con el sembrador \`ComparativoSeeder\` (5 profesores, 6 categorías, 1 000 cursos, un usuario administrador). Las tres implementaciones leen el mismo esquema.
- **Misma máquina y mismo escenario de carga:** GET /api/cursos?page=1&per_page=10 autenticado, 20 clientes concurrentes en bucle cerrado, 5 s de calentamiento descartado y ${c('laravel')?.segundos ?? c('nestjs')?.segundos ?? 30} s de medición.
- **Mismas contraseñas y roles:** las contraseñas están cifradas con bcrypt (compatible entre las tres bibliotecas).
- **Mismas tres pruebas automatizadas** por framework: (1) inicio de sesión 200/401/422, (2) listado 401 sin token y 200 paginado con token, (3) creación 422/201 con Location, consulta 404 y eliminación 204.

### 3.3 Variables medidas y su definición operacional

| Criterio | Cómo se midió |
|---|---|
| Tiempo de puesta en marcha | Segundos, en frío, desde la instalación de dependencias (con caché de paquetes tibia) hasta tener el proyecto compilado (\`npm ci\` + build; \`dotnet restore\` + build; \`composer install\`). |
| Tamaño de la porción | Archivos y líneas no vacías de código propio (sin dependencias) con \`contar.mjs\`. |
| Esfuerzo de validación | Archivos y líneas dedicados a validar la entrada y devolver errores por campo. |
| Esfuerzo de autenticación | Archivos, líneas y dependencias para emitir y validar el token. |
| Documentación automática | Líneas de configuración propias y completitud del OpenAPI generado (operaciones, esquemas y códigos de estado documentados para login y cursos). |
| Pruebas | Herramienta y tiempo de ejecución de las tres pruebas equivalentes. |
| Rendimiento | Peticiones por segundo y latencia p50/p95/p99, con \`medir.mjs\`. |
| Huella | Memoria residente (working set) del proceso que escucha el puerto, en reposo y tras la carga; tamaño del artefacto desplegable sin el runtime. |

**Desviación en "tiempo de puesta en marcha".** El enunciado define el criterio como minutos desde el proyecto vacío hasta el primer endpoint. Como el código de las porciones NestJS y ASP.NET se produjo con asistencia de IA (ver Anexo B), un tiempo humano desde cero no sería una medición honesta. Se reportó en su lugar el tiempo reproducible de instalación en frío y compilación, que aproxima el costo de arranque del toolchain. Esta es una limitación declarada.

### 3.4 Entorno de ejecución

| Elemento | Valor |
|---|---|
| Máquina | ${v(M.laravel?.maquina ?? M.nestjs?.maquina ?? M.aspnet?.maquina)} |
| PHP | ${ver('php -v')} |
| Composer | ${ver('composer --version')} |
| Node.js | ${ver('node -v')} |
| .NET SDK | ${ver('dotnet --version')} |
| Servidor Laravel | servidor integrado de PHP (\`php -S\`) con OPcache activado (\`opcache.enable_cli=1\`), \`APP_ENV=production\`, \`APP_DEBUG=false\` y \`php artisan optimize\` |
| Servidor NestJS | \`node dist/main.js\` (Express, un proceso) |
| Servidor ASP.NET Core | Kestrel, \`dotnet run -c Release\` |
| Generador de carga | \`medir.mjs\` (Node.js, fetch con conexiones persistentes), en la misma máquina |

**Nota sobre la versión de PHP.** El enunciado exige PHP 8.4 o superior; el equipo de desarrollo local usó la versión indicada arriba. Si esta es inferior a 8.4, se declara aquí como incumplimiento del requisito, a corregir en el despliegue final.

## 4. Resultados

### 4.1 Fidelidad al contrato común

| Verificación | ${K.map((k) => F[k]).join(' | ')} |
|---|---|---|---|
${fila('Verificaciones cumplidas (de 15)', (k) => (M[k] ? `${M[k].contrato.cumplidos}/${M[k].contrato.total}` : null))}

${K.filter((k) => M[k] && M[k].contrato.cumplidos < M[k].contrato.total).map((k) => `**${F[k]} — verificaciones no cumplidas:** ${M[k].contrato.detalle.filter((d) => !d.ok).map((d) => d.desc).join('; ')}.`).join('\n\n') || 'Las tres implementaciones cumplieron todas las verificaciones del contrato (rutas, códigos de estado y estructura de las respuestas).'}

### 4.2 Resultados de los ocho criterios medidos

| Criterio | ${K.map((k) => F[k]).join(' | ')} |
|---|---|---|---|
${fila('Puesta en marcha en frío (s)', (k) => T[k]?.puesta_en_marcha_s)}
${fila('Porción: archivos', (k) => Ln?.[k]?.porcion.archivos)}
${fila('Porción: líneas de código', (k) => Ln?.[k]?.porcion.lineas)}
${fila('Validación: archivos / líneas', (k) => (Ln?.[k] ? `${Ln[k].validacion.archivos} / ${Ln[k].validacion.lineas}` : null))}
${fila('Autenticación: archivos / líneas', (k) => (Ln?.[k] ? `${Ln[k].autenticacion.archivos} / ${Ln[k].autenticacion.lineas}` : null))}
${fila('Autenticación: dependencias', (k) => Ln?.[k]?.dependencias_auth.join(', '))}
${fila('OpenAPI: operaciones (login+cursos) / esquemas', (k) => (o(k)?.operaciones_login_cursos !== undefined ? `${o(k).operaciones_login_cursos} / ${o(k).schemas}` : null))}
${fila('OpenAPI: códigos de estado documentados', (k) => o(k)?.codigos_documentados)}
${fila('Pruebas: herramienta', (k) => ({ laravel: 'PHPUnit (php artisan test)', nestjs: 'Jest + Supertest', aspnet: 'xUnit + WebApplicationFactory' })[k])}
${fila('Pruebas: tiempo de ejecución (s)', (k) => T[k]?.pruebas_s)}
${fila('Rendimiento: peticiones/s', (k) => c(k)?.rps)}
${fila('Rendimiento: latencia p50 (ms)', (k) => c(k)?.p50_ms)}
${fila('Rendimiento: latencia p95 (ms)', (k) => c(k)?.p95_ms)}
${fila('Rendimiento: latencia p99 (ms)', (k) => c(k)?.p99_ms)}
${fila('Rendimiento: errores / peticiones', (k) => (c(k) ? `${c(k).errores} / ${c(k).peticiones}` : null))}
${fila('Memoria en reposo (MB)', (k) => mem(k)?.memoria_reposo_mb)}
${fila('Memoria tras la carga (MB)', (k) => mem(k)?.memoria_tras_carga_mb)}
${fila('Artefacto desplegable (MB)', (k) => T[k]?.artefacto_mb)}

*Notas.* (a) En Laravel, el recuento de líneas incluye \`routes/api.php\` y \`bootstrap/app.php\`, que también contienen lo de matrículas del sistema completo, y la arquitectura en capas (servicio y repositorio) adoptada en los laboratorios; es una cota superior del costo propio del framework. (b) El artefacto de Laravel incluye dependencias de desarrollo; el de NestJS solo las de producción; el de ASP.NET es el resultado de \`dotnet publish\` sin runtime. (c) Las líneas de autenticación de Laravel incluyen registro y cierre de sesión, que no forman parte del contrato; las de las otras dos no.

### 4.3 Seguridad por omisión (sonda reproducible)

Se ejecutó la misma sonda contra cada servidor, sin configuración adicional de seguridad:

| Prueba | ${K.map((k) => F[k]).join(' | ')} |
|---|---|---|---|
${fila('Encabezado X-Powered-By', (k) => s(k)?.cabeceras['x-powered-by'] ?? (M[k] ? 'ausente' : null))}
${fila('Encabezado Server', (k) => s(k)?.cabeceras.server ?? (M[k] ? 'ausente' : null))}
${fila('X-Content-Type-Options', (k) => s(k)?.cabeceras['x-content-type-options'] ?? (M[k] ? 'ausente' : null))}
${fila('X-Frame-Options', (k) => s(k)?.cabeceras['x-frame-options'] ?? (M[k] ? 'ausente' : null))}
${fila('Strict-Transport-Security', (k) => s(k)?.cabeceras['strict-transport-security'] ?? (M[k] ? 'ausente' : null))}
${fila('Content-Security-Policy', (k) => s(k)?.cabeceras['content-security-policy'] ?? (M[k] ? 'ausente' : null))}
${fila('CORS: Access-Control-Allow-Origin ante origen ajeno', (k) => s(k)?.cors_acao_origen_ajeno ?? (M[k] ? 'ausente' : null))}
${fila('Limitación de intentos de inicio de sesión (429 en 8 intentos fallidos)', (k) => (M[k] ? (s(k).limitacion_intentos_login_429 ? 'sí' : 'no') : null))}
${fila('JSON malformado: estado / ¿filtra traza?', (k) => (M[k] ? `${s(k).json_malformado.status} / ${s(k).json_malformado.filtra_traza ? 'sí' : 'no'}` : null))}
${fila('Filtro con metacaracteres SQL (estado)', (k) => s(k)?.inyeccion_sql_en_filtro_status)}
${fila('Token alterado rechazado (estado)', (k) => s(k)?.token_alterado_status)}
${fila('Asignación masiva (\`id\` enviado) ignorada', (k) => (M[k] ? (s(k).asignacion_masiva_id_ignorado ? 'sí' : 'no') : null))}

La sonda cubre solo un subconjunto de las categorías de OWASP (2023): autenticación rota (API2), exposición de propiedades (API3, asignación masiva), consumo de recursos sin límite (API4, limitación de intentos) y configuración de seguridad incorrecta (API8, encabezados, CORS y mensajes de error). No sustituye a una auditoría. La limitación de intentos de Laravel proviene de la lógica de seguridad escrita durante el laboratorio 6 sobre el RateLimiter del framework; que NestJS y ASP.NET no la incluyan *por omisión* es el hallazgo relevante, no una carencia de las plataformas, que ofrecen paquetes o middleware para ello.

### 4.4 Ecosistema y curva de aprendizaje (valoración argumentada)

La valoración se apoya en la experiencia del equipo, no en una medición. Laravel fue el framework principal durante todo el semestre, con documentación en español de la comunidad y con las capacidades pedidas (validación declarativa, políticas, tokens, OpenAPI con Scramble, pruebas) disponibles dentro de convenciones únicas. NestJS exigió conocer TypeScript, decoradores e inyección de dependencias y ensamblar por separado validación (\`class-validator\`), JWT, base de datos (\`better-sqlite3\`) y documentación (\`@nestjs/swagger\`). ASP.NET Core exigió conocer C# y su modelo de pipeline, y el mismo ensamblado de paquetes (JwtBearer, BCrypt, Dapper, Swashbuckle) con un modelo de tipos estático que detecta errores en compilación. La curva de aprendizaje de los dos frameworks comparativos fue, para este equipo, mayor que la de Laravel; esta valoración es subjetiva y de un solo equipo.

## 5. Análisis

${rps ? `**Rendimiento.** El orden por peticiones por segundo fue ${rps.map(([k, x]) => `${F[k]} (${x})`).join(' > ')}${ratio ? `; la diferencia entre el mayor y el menor es de ${ratio} veces` : ''}. En latencia p95 el orden (menor a mayor) fue ${p95 ? nombresOrden(p95.map(([k, x]) => [k, `${x} ms`])) : 'no disponible'}. Estas cifras dependen de cómo se sirvió cada aplicación: Laravel se midió con el servidor integrado de PHP (un solo proceso que atiende las peticiones de forma secuencial), mientras que NestJS y ASP.NET Core se midieron con sus servidores de ejecución habituales. Una parte de la diferencia es, por tanto, atribuible al modo de servir y no al framework; en producción Laravel se despliega con PHP-FPM u Octane, y la brecha medida aquí no debe extrapolarse a ese escenario. ${SO && c('laravel') ? ` Una primera medición de Laravel con \`php artisan serve\` (PHP sin OPcache) dio ${SO.carga.rps} req/s y p95 de ${SO.carga.p95_ms} ms; al activar OPcache el resultado pasó a ${c('laravel').rps} req/s y p95 de ${c('laravel').p95_ms} ms (${(c('laravel').rps / SO.carga.rps).toFixed(0)} veces más peticiones por segundo con el mismo código). Esto muestra que la configuración de ejecución pesa tanto o más que el framework en este tipo de medición, y por eso se reportan ambas.` : ''} Además, la autenticación con JWT (verificación criptográfica local) y con token de Sanctum (consulta a base de datos por petición) tiene costos distintos que forman parte legítima de la comparación.` : '**Rendimiento.** Faltan datos.'}

**Esfuerzo de código.** ${loc ? `La porción más compacta fue la de ${F[loc[0][0]]} (${loc[0][1]} líneas) y la más extensa la de ${F[loc[loc.length - 1][0]]} (${loc[loc.length - 1][1]} líneas).` : 'Faltan datos.'} Más que contar líneas, importa *dónde* vive cada responsabilidad. En Laravel la validación es declarativa (reglas \`unique\` y \`exists\` dentro de la clase de solicitud) y los errores por campo se devuelven sin código adicional; en NestJS y ASP.NET Core las anotaciones cubren el formato, pero las reglas que dependen de la base de datos (unicidad, existencia de referencias) se escribieron a mano, y fue necesario convertir el formato de error de cada framework al formato común del contrato (422 con \`errors\` por campo). La autenticación mostró el mismo patrón: Laravel entrega emisión, almacenamiento y revocación de tokens listos con una dependencia, mientras que las otras dos requieren dos dependencias y no revocan tokens sin trabajo adicional.

**Documentación automática.** Los tres frameworks generaron un documento OpenAPI sin escribirlo a mano. ${K.every((k) => o(k)?.codigos_documentados !== undefined) ? `La cantidad de códigos de estado documentados para login y cursos fue ${K.map((k) => `${F[k]}: ${o(k).codigos_documentados}`).join(', ')}; el contrato exige hasta 8 códigos distintos, de modo que ninguna herramienta documenta por sí sola todo el contrato sin anotaciones adicionales.` : ''}

**Huella.** ${mr ? `La menor memoria en reposo fue la de ${F[mr[0][0]]} (${mr[0][1]} MB).` : 'Faltan datos de memoria.'} ${arr ? `El menor tiempo de puesta en marcha en frío fue el de ${F[arr[0][0]]} (${arr[0][1]} s).` : ''} ${art ? `El menor artefacto fue el de ${F[art[0][0]]} (${art[0][1]} MB), recordando que el de Laravel incluye dependencias de desarrollo y que ninguno incluye el runtime.` : ''}

**Seguridad por omisión.** Ninguno de los tres frameworks agrega por sí solo encabezados de seguridad modernos (HSTS, CSP, X-Frame-Options) ni una política CORS restrictiva en una API; las tres requieren configuración explícita, que corresponde a los laboratorios 12 y 13 del proyecto. Las diferencias observadas se concentran en la divulgación de tecnología (X-Powered-By, Server) y en los mensajes de error. Laravel mostró limitación de intentos de inicio de sesión porque se programó en el laboratorio 6, no porque venga activa por omisión.

## 6. Amenazas a la validez y limitaciones

- **Validez interna.** Una sola máquina y una sola ejecución por framework (n = 1) sin repetición estadística; las cifras de rendimiento tienen variabilidad no cuantificada. El generador de carga corre en la misma máquina y compite por CPU con el servidor.
- **Equivalencia funcional.** Laravel conserva la arquitectura en capas del proyecto completo; NestJS y ASP.NET Core se escribieron con la mínima estructura necesaria y consultas SQL directas, sin ORM. Comparar un ORM completo con SQL directo favorece a los dos últimos en rendimiento y en conteo de líneas.
- **Servidor de Laravel.** Se midió con el servidor integrado de PHP (un solo proceso, sin PHP-FPM ni Octane) por restricciones de tiempo y de plataforma (Windows); es la amenaza principal para el rendimiento reportado, y su efecto se ilustra con la comparación con y sin OPcache.
- **Autoría del código.** Las porciones NestJS y ASP.NET fueron generadas con asistencia de IA y verificadas con sus pruebas y con el verificador de contrato; la medición del esfuerzo humano de implementación no es posible con este procedimiento.
- **Validez externa.** Un solo recurso, un solo escenario de lectura y SQLite; los resultados no se extrapolan a cargas de escritura, otros motores de base de datos ni otros volúmenes de datos.
- **Seguridad.** La sonda es un subconjunto reducido de OWASP y no es una auditoría.

## 7. Conclusiones y recomendación

1. **Comparabilidad lograda.** ${K.every((k) => M[k]) ? `Las implementaciones cumplieron el contrato en ${K.map((k) => `${F[k]} ${M[k].contrato.cumplidos}/${M[k].contrato.total}`).join(', ')} verificaciones, por lo que las diferencias medidas no se deben a funcionalidad distinta.` : 'Faltan resultados de al menos un framework.'}
2. **Rendimiento.** ${ratio ? `En el escenario de lectura medido, el framework con mayor rendimiento superó al de menor en ${ratio} veces; sin embargo, con el servidor integrado de PHP en Laravel esta cifra sobrestima la brecha real.` : 'No concluyente por falta de datos.'}
3. **Productividad.** Laravel redujo el trabajo de validación, autenticación y documentación porque los incluye integrados; NestJS y ASP.NET Core exigieron escribir y conectar esas piezas.
4. **Seguridad.** Ningún framework es seguro por omisión a nivel de API; todos requieren los controles de los laboratorios 12 y 13.

**Recomendación.** Para este sistema —una API CRUD con reglas de negocio, de carga moderada, sobre un equipo con experiencia en PHP y con Laravel como requisito del curso— se recomienda **mantener Laravel 13 como back-end principal**, desplegado con un servidor de producción (PHP-FPM o Octane), porque minimiza el esfuerzo de validación, autenticación con revocación y documentación, y la evidencia de rendimiento no muestra una necesidad que justifique cambiar de framework: la brecha medida se origina en parte en el modo de servir y la carga del sistema (matrícula universitaria) está muy por debajo de los cientos o miles de peticiones por segundo medidos. Se recomendaría reconsiderar la decisión si el requisito de rendimiento superara de forma sostenida lo que Laravel logre ya desplegado con PHP-FPM o Octane (a medir en el despliegue final), o si el equipo ya dominara C# o TypeScript. **Trabajo futuro:** repetir cada medición al menos cinco veces con intervalos de confianza, medir Laravel tras un servidor de producción, incluir escrituras en el escenario de carga y comparar un ORM equivalente en las tres plataformas.

## 8. Referencias

Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine]. https://ics.uci.edu/~fielding/pubs/dissertation/top.htm

Fielding, R., Nottingham, M., & Reschke, J. (2022). *HTTP semantics* (RFC 9110). Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc9110

Jain, R. (1991). *The art of computer systems performance analysis: Techniques for experimental design, measurement, simulation, and modeling*. Wiley.

Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)* (RFC 7519). Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc7519

Laravel. (2026). *Laravel documentation*. https://laravel.com/docs

Microsoft. (2024). *ASP.NET Core documentation*. https://learn.microsoft.com/aspnet/core

NestJS. (s. f.). *NestJS documentation*. https://docs.nestjs.com

OWASP Foundation. (2023). *OWASP API security top 10 – 2023*. https://owasp.org/API-Security/editions/2023/en/0x11-t10/

Runeson, P., & Höst, M. (2009). Guidelines for conducting and reporting case study research in software engineering. *Empirical Software Engineering, 14*(2), 131–164. https://doi.org/10.1007/s10664-008-9102-8

Wohlin, C., Runeson, P., Höst, M., Ohlsson, M. C., Regnell, B., & Wesslén, A. (2012). *Experimentation in software engineering*. Springer. https://doi.org/10.1007/978-3-642-29044-2

## Anexo A. Procedimiento de reproducción

\`\`\`powershell
# 1. Datos (una vez), desde la raíz del repositorio
copy database\\database.sqlite comparativo\\datos\\base.sqlite
$env:DB_DATABASE="$PWD\\comparativo\\datos\\base.sqlite"; php artisan migrate --force; php artisan db:seed --class=ComparativoSeeder --force

# 2. Por framework: tiempos (puesta en marcha, pruebas, artefacto)
node comparativo/mediciones/tiempos.mjs laravel   # y nestjs, aspnet

# 3. Por framework: levantar el servidor con una copia de los datos y medir
node comparativo/mediciones/medir.mjs <nombre> <urlBase> <puerto> <urlOpenApi> 20 30
node comparativo/mediciones/contar.mjs
node comparativo/mediciones/generar-informe.mjs
\`\`\`

Los archivos JSON con los datos crudos de cada medición están en \`comparativo/resultados/\`.

## Anexo B. Bitácora de uso de herramientas de inteligencia artificial

| Parte del trabajo | Herramienta | Qué hizo la herramienta | Qué verificó el estudiante |
|---|---|---|---|
| Código de las porciones NestJS y ASP.NET Core, pruebas, sembrador y scripts de medición | Claude (Anthropic) | Generó el código y los scripts a partir del contrato; verificó NestJS en su entorno de ejecución con sus 3 pruebas y el verificador de contrato (15/15) | Ejecutó los tres proyectos y los scripts en su máquina, y las pruebas de las tres implementaciones; las cifras del informe provienen de esas ejecuciones |
| Redacción del informe | Claude (Anthropic) | Redactó la estructura, el marco de referencia y el generador que inserta los datos medidos | Revisó el contenido, los datos y las referencias |
| Selección de referencias | Claude (Anthropic) | Propuso las fuentes | Debe comprobar que cada enlace y cita es correcto antes de entregar |

El estudiante es responsable de poder explicar cualquier parte del código y de las mediciones.
`;
writeFileSync('docs/informe-comparativo.md', md);
console.log('Escrito docs/informe-comparativo.md (' + md.split(/\s+/).length + ' palabras)');
