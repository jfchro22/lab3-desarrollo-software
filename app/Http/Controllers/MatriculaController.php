<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListarMatriculaRequest;
use App\Http\Requests\StoreMatriculaRequest;
use App\Http\Requests\UpdateMatriculaRequest;
use App\Http\Resources\MatriculaResource;
use App\Models\Curso;
use App\Models\Matricula;
use App\Services\MatriculaService;

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
     * Devuelve un listado paginado de matrículas. Si se llama anidado bajo un
     * curso (`/cursos/{curso}/matriculas`), se filtra automáticamente por ese curso.
     * Admite filtros por estudiante y por si tiene nota registrada.
     */
    public function index(ListarMatriculaRequest $request, ?Curso $curso = null)
    {
        $filtros = $request->validated();

        if ($curso) {
            $filtros['curso_id'] = $curso->id;
        }

        return MatriculaResource::collection($this->service->listar($filtros));
    }

    /**
     * Crear una matrícula
     *
     * Matricula a un estudiante en un curso, validando cupo máximo del curso
     * y límite de carga académica del estudiante. Si se llama anidado bajo un
     * curso, el curso se toma de la ruta.
     */
    public function store(StoreMatriculaRequest $request, ?Curso $curso = null)
    {
        $datos = $request->validated();

        if ($curso) {
            $datos['curso_id'] = $curso->id;
        }

        $matricula = $this->service->crear($datos);

        return (new MatriculaResource($matricula))
            ->response()
            ->setStatusCode(201)
            ->header('Location', route('matriculas.show', $matricula));
    }

    /**
     * Mostrar una matrícula
     *
     * Devuelve el detalle de una matrícula, incluyendo estudiante y curso.
     */
    public function show(Matricula $matricula)
    {
        return new MatriculaResource($matricula->load(['estudiante', 'curso']));
    }

    /**
     * Registrar la nota de una matrícula
     *
     * Actualiza la nota de una matrícula existente. Rechaza el registro si
     * el curso todavía no ha iniciado.
     */
    public function update(UpdateMatriculaRequest $request, Matricula $matricula)
    {
        $matricula = $this->service->actualizarNota($matricula, $request->validated());
        return new MatriculaResource($matricula);
    }

    /**
     * Eliminar una matrícula
     *
     * Elimina una matrícula existente.
     */
    public function destroy(Matricula $matricula)
    {
        $this->service->eliminar($matricula);
        return response()->json(null, 204);
    }
}