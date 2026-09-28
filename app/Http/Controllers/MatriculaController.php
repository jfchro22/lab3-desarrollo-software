<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListarMatriculaRequest;
use App\Http\Requests\StoreMatriculaRequest;
use App\Http\Requests\UpdateMatriculaRequest;
use App\Http\Resources\MatriculaResource;
use App\Models\Curso;
use App\Models\Matricula;
use App\Services\MatriculaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * @tags Matrículas
 */
class MatriculaController extends Controller
{
    public function __construct(private MatriculaService $service)
    {
    }

    /**
     * Listar matrículas
     *
     * Devuelve un listado paginado de matrículas. Cada rol solo ve las que le corresponden:
     * el estudiante las suyas y el profesor las de sus cursos. Si se llama anidado bajo un
     * curso (`/cursos/{curso}/matriculas`), se filtra por ese curso.
     */
    public function index(ListarMatriculaRequest $request, ?Curso $curso = null)
    {
        $filtros = $request->validated();

        if ($curso) {
            $filtros['curso_id'] = $curso->id;
        }

        return MatriculaResource::collection(
            $this->service->listar($request->user(), $filtros)
        );
    }

    /**
     * Crear una matrícula
     *
     * Matricula a un estudiante en un curso, validando cupo máximo del curso
     * y límite de carga académica. Un estudiante solo puede matricularse a sí mismo.
     */
    public function store(StoreMatriculaRequest $request, ?Curso $curso = null)
    {
        $datos = $request->validated();

        if ($curso) {
            $datos['curso_id'] = $curso->id;
        }

        Gate::authorize('create', [Matricula::class, (int) $datos['estudiante_id']]);

        $matricula = $this->service->crear($request->user(), $datos);

        return (new MatriculaResource($matricula))
            ->response()
            ->setStatusCode(201)
            ->header('Location', route('matriculas.show', $matricula));
    }

    /**
     * Mostrar una matrícula
     *
     * Devuelve el detalle de una matrícula. Solo si le corresponde a la persona usuaria.
     */
    public function show(Request $request, Matricula $matricula)
    {
        Gate::authorize('view', $matricula);

        return new MatriculaResource($this->service->obtener($request->user(), $matricula));
    }

    /**
     * Registrar la nota de una matrícula
     *
     * Solo el administrador o el profesor del curso. Rechaza el registro si
     * el curso todavía no ha iniciado.
     */
    public function update(UpdateMatriculaRequest $request, Matricula $matricula)
    {
        Gate::authorize('update', $matricula);

        $matricula = $this->service->actualizarNota($request->user(), $matricula, $request->validated());

        return new MatriculaResource($matricula);
    }

    /**
     * Eliminar una matrícula
     *
     * Solo administradores.
     */
    public function destroy(Request $request, Matricula $matricula)
    {
        Gate::authorize('delete', $matricula);

        $this->service->eliminar($request->user(), $matricula);

        return response()->json(null, 204);
    }
}