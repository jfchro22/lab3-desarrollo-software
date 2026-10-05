<?php

namespace App\Repositories;

use App\Models\Matricula;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentMatriculaRepository implements MatriculaRepository
{
    public function crear(array $datos): Matricula
    {
        return Matricula::create([
            'estudiante_id' => $datos['estudiante_id'],
            'curso_id' => $datos['curso_id'],
            'fecha_matricula' => $datos['fecha_matricula'],
            'nota' => $datos['nota'] ?? null,
        ])->load(['estudiante', 'curso']);
    }

    public function actualizarNota(Matricula $matricula, float $nota): Matricula
    {
        $matricula->update(['nota' => $nota]);

        return $matricula->fresh(['estudiante', 'curso']);
    }

    public function eliminar(Matricula $matricula): void
    {
        $matricula->delete();
    }

    public function contarPorCurso(int $cursoId): int
    {
        return Matricula::where('curso_id', $cursoId)->count();
    }

    public function contarPorEstudiante(int $estudianteId): int
    {
        return Matricula::where('estudiante_id', $estudianteId)->count();
    }

    public function paginar(array $filtros, int $perPage, User $actor): LengthAwarePaginator
    {
        $query = Matricula::query()->with(['estudiante', 'curso']);

        if ($actor->esEstudiante()) {
            $query->where('estudiante_id', $actor->estudiante_id ?? 0);
        } elseif ($actor->esProfesor()) {
            $query->whereHas('curso', fn ($q) => $q->where('profesor_id', $actor->profesor_id ?? 0));
        }

        if (!empty($filtros['curso_id'])) {
            $query->where('curso_id', $filtros['curso_id']);
        }
        if (!empty($filtros['estudiante_id'])) {
            $query->where('estudiante_id', $filtros['estudiante_id']);
        }
        if (!empty($filtros['con_nota'])) {
            $filtros['con_nota'] === 'si'
                ? $query->whereNotNull('nota')
                : $query->whereNull('nota');
        }

        $sort = in_array($filtros['sort'] ?? null, ['fecha_matricula', 'nota']) ? $filtros['sort'] : 'fecha_matricula';
        $direction = ($filtros['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $direction);

        return $query->paginate($perPage);
    }
}