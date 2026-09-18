<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatriculaRequest;
use App\Http\Requests\UpdateMatriculaRequest;
use App\Http\Resources\MatriculaResource;
use App\Models\Matricula;
use App\Services\MatriculaService;
use Illuminate\Http\Request;

class MatriculaController extends Controller
{
    public function __construct(private MatriculaService $service)
    {
    }

    public function index(Request $request)
    {
        return MatriculaResource::collection($this->service->listar($request->all()));
    }

    public function store(StoreMatriculaRequest $request)
    {
        $matricula = $this->service->crear($request->validated());

        return (new MatriculaResource($matricula))
            ->response()
            ->setStatusCode(201)
            ->header('Location', route('matriculas.show', $matricula));
    }

    public function show(Matricula $matricula)
    {
        return new MatriculaResource($matricula->load(['estudiante', 'curso']));
    }

    public function update(UpdateMatriculaRequest $request, Matricula $matricula)
    {
        $matricula = $this->service->actualizarNota($matricula, $request->validated());
        return new MatriculaResource($matricula);
    }

    public function destroy(Matricula $matricula)
    {
        $this->service->eliminar($matricula);
        return response()->json(null, 204);
    }
}