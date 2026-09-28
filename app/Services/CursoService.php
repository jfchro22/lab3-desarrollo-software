<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Curso;
use App\Models\User;
use App\Services\Concerns\AutorizaAcciones;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CursoService
{
    use AutorizaAcciones;

    private const MAX_PAGE_SIZE = 50;

    public function crear(User $actor, array $datos): Curso
    {
        $this->autorizar($actor, 'create', Curso::class);

        return DB::transaction(function () use ($datos) {
            $curso = Curso::create([
                'nombre' => $datos['nombre'],
                'creditos' => $datos['creditos'],
                'profesor_id' => $datos['profesor_id'],
            ]);

            $curso->categorias()->sync($datos['categoria_ids']);

            return $curso->load(['profesor', 'categorias']);
        });
    }

    public function actualizar(User $actor, Curso $curso, array $datos): Curso
    {
        $this->autorizar($actor, 'update', $curso);

        return DB::transaction(function () use ($curso, $datos) {
            $curso->fill(array_filter([
                'nombre' => $datos['nombre'] ?? null,
                'creditos' => $datos['creditos'] ?? null,
                'profesor_id' => $datos['profesor_id'] ?? null,
            ], fn ($valor) => $valor !== null));
            $curso->save();

            if (array_key_exists('categoria_ids', $datos)) {
                $curso->categorias()->sync($datos['categoria_ids']);
            }

            return $curso->load(['profesor', 'categorias']);
        });
    }

    public function eliminar(User $actor, Curso $curso): void
    {
        $this->autorizar($actor, 'delete', $curso);

        if ($curso->matriculas()->exists()) {
            throw new BusinessRuleException(
                'No se puede eliminar el curso porque tiene estudiantes matriculados.',
                'curso_con_matriculas_activas'
            );
        }

        DB::transaction(function () use ($curso) {
            $curso->categorias()->detach();
            $curso->delete();
        });
    }

    public function listar(User $actor, array $filtros): LengthAwarePaginator
    {
        $this->autorizar($actor, 'viewAny', Curso::class);

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

        $perPage = max(1, min((int) ($filtros['per_page'] ?? 15), self::MAX_PAGE_SIZE));

        return $query->paginate($perPage);
    }
}