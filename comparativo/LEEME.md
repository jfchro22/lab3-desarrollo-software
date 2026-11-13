# Estudio comparativo — guía de ejecución (Windows / PowerShell)

Todo desde la **raíz del repo** (`C:\laragon\www\lab3-nombreproyecto`). Requisitos: Node 18+, PHP/Composer (ya los tenés) y **.NET SDK 8 o superior** (`dotnet --version`; si falta: `winget install Microsoft.DotNet.SDK.8`).
Usá **tres terminales**: A = servidor, B = mediciones. Siempre `http://127.0.0.1`, no `localhost`.

## 0. Un cambio previo en Laravel (ya viene en el zip)
`app/Http/Resources/CursoResource.php` ahora devuelve `profesor_id` (el contrato lo exige). Corré antes: `php artisan test` (debe seguir en verde).

## 1. Datos (una sola vez)
```powershell
copy database\database.sqlite comparativo\datos\base.sqlite
$env:DB_DATABASE="$PWD\comparativo\datos\base.sqlite"
php artisan migrate --force
php artisan db:seed --class=ComparativoSeeder --force
Remove-Item Env:DB_DATABASE
```

## 2. Laravel
```powershell
# B: tiempos (borra vendor y reinstala, tarda unos minutos)
node comparativo/mediciones/tiempos.mjs laravel
copy comparativo\datos\base.sqlite comparativo\datos\laravel.sqlite
# A: servidor
$env:DB_DATABASE="$PWD\comparativo\datos\laravel.sqlite"; $env:APP_ENV="production"; $env:APP_DEBUG="false"
php artisan serve --host=127.0.0.1 --port=8000
# B: documentación y medición (la medición tarda ~2 min; si hay bloqueo por intentos espera 65 s sola)
php artisan scramble:export --path=comparativo/resultados/laravel-openapi.json
cd comparativo\mediciones
node medir.mjs laravel http://127.0.0.1:8000 8000 ..\resultados\laravel-openapi.json 20 30
cd ..\..
```
Cerrá el servidor (Ctrl+C en A) y `Remove-Item Env:DB_DATABASE,Env:APP_ENV,Env:APP_DEBUG`.
Si `scramble:export` falla: `php artisan scramble:export` sin `--path` y usá el archivo `api.json` que cree.

## 3. NestJS
```powershell
node comparativo/mediciones/tiempos.mjs nestjs
copy comparativo\datos\base.sqlite comparativo\datos\nestjs.sqlite
# A:
cd comparativo\nestjs
$env:DB_PATH="$((Resolve-Path ..\datos\nestjs.sqlite).Path)"; $env:PORT="3001"
node dist/main.js
# B:
cd comparativo\mediciones
node medir.mjs nestjs http://127.0.0.1:3001 3001 http://127.0.0.1:3001/openapi.json 20 30
cd ..\..
```
(`tiempos.mjs nestjs` deja solo dependencias de producción; el build ya está hecho.)

## 4. ASP.NET Core
```powershell
node comparativo/mediciones/tiempos.mjs aspnet
copy comparativo\datos\base.sqlite comparativo\datos\aspnet.sqlite
# A:
cd comparativo\aspnet\Comparativo.Api
$env:DB_PATH="$((Resolve-Path ..\..\datos\aspnet.sqlite).Path)"
dotnet run -c Release --urls http://127.0.0.1:3002
# B:
cd comparativo\mediciones
node medir.mjs aspnet http://127.0.0.1:3002 3002 http://127.0.0.1:3002/swagger/v1/swagger.json 20 30
cd ..\..
```

## 5. Informe
```powershell
node comparativo/mediciones/contar.mjs
node comparativo/mediciones/generar-informe.mjs
npx --yes marked -i docs/informe-comparativo.md -o docs/informe-comparativo.html --gfm
```
Abrí `docs/informe-comparativo.html` en el navegador → Ctrl+P → Guardar como PDF (es lo que se sube). Ajustá en el `.md` solo lo que yo te diga.

## 6. Git
```powershell
$git = "C:\Program Files\Git\cmd\git.exe"
& $git add comparativo docs/informe-comparativo.md database/seeders tests/Feature/ComparativoContratoTest.php app/Http/Resources/CursoResource.php
& $git commit -m "feat(investigacion): estudio comparativo Laravel vs NestJS vs ASP.NET Core con mediciones"
& $git push
```
