<?php

use App\Exceptions\BusinessRuleException;
use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Regla de negocio violada → código HTTP según la regla (409 por defecto)
        $exceptions->render(function (BusinessRuleException $e, Request $request) {
            $estados = [
                'credenciales_invalidas' => 401,
                'demasiados_intentos'    => 429,
                'acceso_no_autorizado'   => 403,
            ];

            return response()->json([
                'message'   => $e->getMessage(),
                'rule_code' => $e->getRuleCode(),
            ], $estados[$e->getRuleCode()] ?? 409);
        });

        // Modelo no encontrado en la API → 404 limpio, sin traza
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') && $e->getPrevious() instanceof ModelNotFoundException) {
                return response()->json([
                    'message' => 'Recurso no encontrado.',
                ], 404);
            }
        });
    })->create();