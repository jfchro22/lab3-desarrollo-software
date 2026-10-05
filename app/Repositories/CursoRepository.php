<?php

namespace App\Repositories;

use App\Models\Curso;
use Illuminate\Pagination\LengthAwarePaginator;

interface CursoRepository
{
    public function crear(array $datos): Curso;

    public function actualizar(Curso $curso, array $datos): Curso;

    public function eliminar(Curso $curso): void;

    public function sincronizarCategorias(Curso $curso, array $categoriaIds): void;

    public function tieneMatriculas(Curso $curso): bool;

    public function buscarOFallar(int $id): Curso;

    public function paginar(array $filtros, int $perPage): LengthAwarePaginator;
}