<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatriculaRequest;
use App\Http\Requests\UpdateMatriculaRequest;
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
        return response()->json($this->service->listar($request->all()));
    }

    public function store(StoreMatriculaRequest $request)
    {
        $matricula = $this->service->crear($request->validated());
        return response()->json($matricula, 201);
    }

    public function update(UpdateMatriculaRequest $request, Matricula $matricula)
    {
        $matricula = $this->service->actualizarNota($matricula, $request->validated());
        return response()->json($matricula);
    }

    public function destroy(Matricula $matricula)
    {
        $this->service->eliminar($matricula);
        return response()->json(null, 204);
    }
        public function show(Matricula $matricula)
    {
        return response()->json($matricula->load(['estudiante', 'curso']));
    }
}