<?php

namespace App\Policies;

use App\Models\Matricula;
use App\Models\User;

class MatriculaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Matricula $matricula): bool
    {
        if ($user->esAdmin()) {
            return true;
        }

        if ($user->esEstudiante()) {
            return $user->estudiante_id !== null
                && (int) $matricula->estudiante_id === (int) $user->estudiante_id;
        }

        if ($user->esProfesor()) {
            return $user->profesor_id !== null
                && (int) $matricula->curso->profesor_id === (int) $user->profesor_id;
        }

        return false;
    }

    /**
     * Un estudiante solo puede matricularse a sí mismo; el admin puede matricular a cualquiera.
     */
    public function create(User $user, ?int $estudianteId = null): bool
    {
        if ($user->esAdmin()) {
            return true;
        }

        return $user->esEstudiante()
            && $user->estudiante_id !== null
            && (int) $user->estudiante_id === (int) $estudianteId;
    }

    /**
     * Registrar nota: admin, o el profesor que imparte ese curso.
     */
    public function update(User $user, Matricula $matricula): bool
    {
        if ($user->esAdmin()) {
            return true;
        }

        return $user->esProfesor()
            && $user->profesor_id !== null
            && (int) $matricula->curso->profesor_id === (int) $user->profesor_id;
    }

    public function delete(User $user, Matricula $matricula): bool
    {
        return $user->esAdmin();
    }
}