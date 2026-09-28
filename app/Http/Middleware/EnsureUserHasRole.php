<?php

namespace App\Http\Middleware;

use App\Exceptions\BusinessRuleException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $usuario = $request->user();

        if (! $usuario || ! in_array($usuario->role, $roles, true)) {
            throw new BusinessRuleException(
                'No tiene permisos para realizar esta acción.',
                'acceso_no_autorizado'
            );
        }

        return $next($request);
    }
}