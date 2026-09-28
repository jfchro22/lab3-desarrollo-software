<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListarCursosRequest;
use App\Http\Requests\StoreCursoRequest;
use App\Http\Requests\UpdateCursoRequest;
use App\Http\Resources\CursoResource;
use App\Models\Curso;
use App\Services\CursoService;
use Illuminate\Support\Facades\Gate;

/**
 * @tags Cursos
 */
class CursoController extends Controller
{
    public function __construct(private CursoService $service)
    {
    }

    /**
     * Listar cursos
     *
     * Devuelve un listado paginado de cursos, con filtros opcionales por
     * nombre, profesor y créditos mínimos, y orden configurable.
     */
    public function index(ListarCursosRequest $request)
    {
        return CursoResource::collection(
            $this->service->listar($request->user(), $request->validated())
        );
    }

    /**
     * Crear un curso
     *
     * Registra un nuevo curso junto con sus categorías asociadas. Solo administradores.
     */
    public function store(StoreCursoRequest $request)
    {
        Gate::authorize('create', Curso::class);

        $curso = $this->service->crear($request->user(), $request->validated());

        return (new CursoResource($curso))
            ->response()
            ->setStatusCode(201)
            ->header('Location', route('cursos.show', $curso));
    }

    /**
     * Mostrar un curso
     *
     * Devuelve el detalle de un curso, incluyendo su profesor y categorías.
     */
    public function show(Curso $curso)
    {
        return new CursoResource($curso->load(['profesor', 'categorias']));
    }

    /**
     * Actualizar un curso
     *
     * Actualiza los datos de un curso existente y, opcionalmente, sus categorías. Solo administradores.
     */
    public function update(UpdateCursoRequest $request, Curso $curso)
    {
        Gate::authorize('update', $curso);

        $curso = $this->service->actualizar($request->user(), $curso, $request->validated());

        return new CursoResource($curso);
    }

    /**
     * Eliminar un curso
     *
     * Elimina un curso, siempre que no tenga matrículas activas. Solo administradores.
     */
    public function destroy(\Illuminate\Http\Request $request, Curso $curso)
    {
        Gate::authorize('delete', $curso);

        $this->service->eliminar($request->user(), $curso);

        return response()->json(null, 204);
    }
}