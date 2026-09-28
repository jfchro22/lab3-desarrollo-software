<?php

namespace App\Services\Concerns;

use App\Exceptions\BusinessRuleException;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

trait AutorizaAcciones
{
    /**
     * Segunda capa de autorización: se verifica dentro del servicio,
     * de modo que una invocación directa sin pasar por la ruta también es rechazada.
     */
    protected function autorizar(User $actor, string $habilidad, mixed $argumentos): void
    {
        if (! Gate::forUser($actor)->allows($habilidad, $argumentos)) {
            throw new BusinessRuleException(
                'No tiene permisos para realizar esta acción.',
                'acceso_no_autorizado'
            );
        }
    }
}