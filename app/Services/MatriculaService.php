<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Matricula;
use App\Models\User;
use App\Repositories\CursoRepository;
use App\Repositories\MatriculaRepository;
use App\Services\Concerns\AutorizaAcciones;
use Illuminate\Pagination\LengthAwarePaginator;

class MatriculaService
{
    use AutorizaAcciones;

    private const MAX_PAGE_SIZE = 50;
    private const CUPO_MAXIMO_POR_CURSO = 30;
    private const MAX_CURSOS_POR_ESTUDIANTE = 6;

    public function __construct(
        private MatriculaRepository $repositorio,
        private CursoRepository $cursoRepositorio
    ) {
    }

    public function crear(User $actor, array $datos): Matricula
    {
        $this->autorizar($actor, 'create', [Matricula::class, (int) ($datos['estudiante_id'] ?? 0)]);

        $curso = $this->cursoRepositorio->buscarOFallar($datos['curso_id']);

        // REGLA DE NEGOCIO 2: el curso no puede exceder su cupo máximo.
        if ($this->repositorio->contarPorCurso($curso->id) >= self::CUPO_MAXIMO_POR_CURSO) {
            throw new BusinessRuleException(
                'El curso ya alcanzó el cupo máximo de estudiantes.',
                'cupo_maximo_alcanzado'
            );
        }

        // REGLA DE NEGOCIO 3: un estudiante no puede llevar más de N cursos a la vez.
        if ($this->repositorio->contarPorEstudiante($datos['estudiante_id']) >= self::MAX_CURSOS_POR_ESTUDIANTE) {
            throw new BusinessRuleException(
                'El estudiante ya alcanzó el máximo de cursos matriculados simultáneamente.',
                'limite_carga_academica'
            );
        }

        return $this->repositorio->crear($datos);
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

        return $this->repositorio->actualizarNota($matricula, (float) $datos['nota']);
    }

    public function eliminar(User $actor, Matricula $matricula): void
    {
        $this->autorizar($actor, 'delete', $matricula);

        $this->repositorio->eliminar($matricula);
    }

    public function listar(User $actor, array $filtros): LengthAwarePaginator
    {
        $this->autorizar($actor, 'viewAny', Matricula::class);

        $perPage = max(1, min((int) ($filtros['per_page'] ?? 15), self::MAX_PAGE_SIZE));

        return $this->repositorio->paginar($filtros, $perPage, $actor);
    }
}