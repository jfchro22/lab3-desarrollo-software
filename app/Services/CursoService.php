<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Curso;
use App\Models\User;
use App\Repositories\CursoRepository;
use App\Services\Concerns\AutorizaAcciones;
use Illuminate\Pagination\LengthAwarePaginator;

class CursoService
{
    use AutorizaAcciones;

    private const MAX_PAGE_SIZE = 50;

    public function __construct(private CursoRepository $repositorio)
    {
    }

    public function crear(User $actor, array $datos): Curso
    {
        $this->autorizar($actor, 'create', Curso::class);

        return $this->repositorio->crear($datos);
    }

    public function actualizar(User $actor, Curso $curso, array $datos): Curso
    {
        $this->autorizar($actor, 'update', $curso);

        return $this->repositorio->actualizar($curso, $datos);
    }

    public function eliminar(User $actor, Curso $curso): void
    {
        $this->autorizar($actor, 'delete', $curso);

        if ($this->repositorio->tieneMatriculas($curso)) {
            throw new BusinessRuleException(
                'No se puede eliminar el curso porque tiene estudiantes matriculados.',
                'curso_con_matriculas_activas'
            );
        }

        $this->repositorio->eliminar($curso);
    }

    public function listar(User $actor, array $filtros): LengthAwarePaginator
    {
        $this->autorizar($actor, 'viewAny', Curso::class);

        $perPage = max(1, min((int) ($filtros['per_page'] ?? 15), self::MAX_PAGE_SIZE));

        return $this->repositorio->paginar($filtros, $perPage);
    }
}