<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Curso;
use App\Models\Matricula;
use App\Models\User;
use App\Services\Concerns\AutorizaAcciones;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MatriculaService
{
    use AutorizaAcciones;

    private const MAX_PAGE_SIZE = 50;
    private const CUPO_MAXIMO_POR_CURSO = 30;
    private const MAX_CURSOS_POR_ESTUDIANTE = 6;

    public function crear(User $actor, array $datos): Matricula
    {
        $this->autorizar($actor, 'create', [Matricula::class, (int) ($datos['estudiante_id'] ?? 0)]);

        $curso = Curso::findOrFail($datos['curso_id']);

        // REGLA DE NEGOCIO 2: el curso no puede exceder su cupo máximo.
        if ($curso->matriculas()->count() >= self::CUPO_MAXIMO_POR_CURSO) {
            throw new BusinessRuleException(
                'El curso ya alcanzó el cupo máximo de estudiantes.',
                'cupo_maximo_alcanzado'
            );
        }

        // REGLA DE NEGOCIO 3: un estudiante no puede llevar más de N cursos a la vez.
        $cursosDelEstudiante = Matricula::where('estudiante_id', $datos['estudiante_id'])->count();
        if ($cursosDelEstudiante >= self::MAX_CURSOS_POR_ESTUDIANTE) {
            throw new BusinessRuleException(
                'El estudiante ya alcanzó el máximo de cursos matriculados simultáneamente.',
                'limite_carga_academica'
            );
        }

        return DB::transaction(function () use ($datos) {
            return Matricula::create([
                'estudiante_id' => $datos['estudiante_id'],
                'curso_id' => $datos['curso_id'],
                'fecha_matricula' => $datos['fecha_matricula'],
                'nota' => $datos['nota'] ?? null,
            ])->load(['estudiante', 'curso']);
        });
    }

    public function obtener(User $actor, Matricula $matricula): Matricula
    {
        $matricula->loadMissing(['estudiante', 'curso']);
        $this->autorizar($actor, 'view', $matricula);

        return $matricula;
    }

    public function actualizarNota(User $actor, Matricula $matricula, array $datos): Matricula
    {
        $matricula->loadMissing('curso');
        $this->autorizar($actor, 'update', $matricula);

        // REGLA DE NEGOCIO 4: no se puede registrar la nota de una matrícula
        // cuyo curso todavía no ha iniciado.
        if ($matricula->fecha_matricula->toDateString() > now()->toDateString()) {
            throw new BusinessRuleException(
                'No se puede registrar la nota de una matrícula cuyo curso todavía no ha iniciado.',
                'matricula_no_iniciada'
            );
        }

        $matricula->update(['nota' => $datos['nota']]);

        return $matricula->fresh(['estudiante', 'curso']);
    }

    public function eliminar(User $actor, Matricula $matricula): void
    {
        $this->autorizar($actor, 'delete', $matricula);

        $matricula->delete();
    }

    public function listar(User $actor, array $filtros): LengthAwarePaginator
    {
        $this->autorizar($actor, 'viewAny', Matricula::class);

        $query = Matricula::query()->with(['estudiante', 'curso']);

        // Autorización por recurso: cada rol solo ve los registros que le corresponden.
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

        $perPage = max(1, min((int) ($filtros['per_page'] ?? 15), self::MAX_PAGE_SIZE));

        return $query->paginate($perPage);
    }
}