<?php

namespace App\Repositories;

use App\Models\Curso;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentCursoRepository implements CursoRepository
{
    public function crear(array $datos): Curso
    {
        $curso = Curso::create([
            'nombre' => $datos['nombre'],
            'creditos' => $datos['creditos'],
            'profesor_id' => $datos['profesor_id'],
        ]);

        $this->sincronizarCategorias($curso, $datos['categoria_ids']);

        return $curso->load(['profesor', 'categorias']);
    }

    public function actualizar(Curso $curso, array $datos): Curso
    {
        $curso->fill(array_filter([
            'nombre' => $datos['nombre'] ?? null,
            'creditos' => $datos['creditos'] ?? null,
            'profesor_id' => $datos['profesor_id'] ?? null,
        ], fn ($valor) => $valor !== null));
        $curso->save();

        if (array_key_exists('categoria_ids', $datos)) {
            $this->sincronizarCategorias($curso, $datos['categoria_ids']);
        }

        return $curso->load(['profesor', 'categorias']);
    }

    public function eliminar(Curso $curso): void
    {
        $curso->categorias()->detach();
        $curso->delete();
    }

    public function sincronizarCategorias(Curso $curso, array $categoriaIds): void
    {
        $curso->categorias()->sync($categoriaIds);
    }

    public function tieneMatriculas(Curso $curso): bool
    {
        return $curso->matriculas()->exists();
    }

    public function buscarOFallar(int $id): Curso
    {
        return Curso::findOrFail($id);
    }

    public function paginar(array $filtros, int $perPage): LengthAwarePaginator
    {
        $query = Curso::query()->with(['profesor', 'categorias']);

        if (!empty($filtros['nombre'])) {
            $query->where('nombre', 'like', '%' . $filtros['nombre'] . '%');
        }
        if (!empty($filtros['profesor_id'])) {
            $query->where('profesor_id', $filtros['profesor_id']);
        }
        if (!empty($filtros['creditos_min'])) {
            $query->where('creditos', '>=', $filtros['creditos_min']);
        }

        $sort = in_array($filtros['sort'] ?? null, ['nombre', 'creditos']) ? $filtros['sort'] : 'nombre';
        $direction = ($filtros['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction);

        return $query->paginate($perPage);
    }
}