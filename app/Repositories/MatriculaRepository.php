<?php

namespace App\Repositories;

use App\Models\Matricula;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface MatriculaRepository
{
    public function crear(array $datos): Matricula;

    public function actualizarNota(Matricula $matricula, float $nota): Matricula;

    public function eliminar(Matricula $matricula): void;

    public function contarPorCurso(int $cursoId): int;

    public function contarPorEstudiante(int $estudianteId): int;

    public function paginar(array $filtros, int $perPage, User $actor): LengthAwarePaginator;
}