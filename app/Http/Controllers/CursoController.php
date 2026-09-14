<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCursoRequest;
use App\Http\Requests\UpdateCursoRequest;
use App\Models\Curso;
use App\Services\CursoService;
use Illuminate\Http\Request;

class CursoController extends Controller
{
    public function __construct(private CursoService $service)
    {
    }

    public function index(Request $request)
    {
        return response()->json($this->service->listar($request->all()));
    }

    public function store(StoreCursoRequest $request)
    {
        $curso = $this->service->crear($request->validated());
        return response()->json($curso, 201);
    }

    public function update(UpdateCursoRequest $request, Curso $curso)
    {
        $curso = $this->service->actualizar($curso, $request->validated());
        return response()->json($curso);
    }

    public function destroy(Curso $curso)
    {
        $this->service->eliminar($curso);
        return response()->json(null, 204);
    }
        public function show(Curso $curso)
    {
        return response()->json($curso->load(['profesor', 'categorias']));
    }
}