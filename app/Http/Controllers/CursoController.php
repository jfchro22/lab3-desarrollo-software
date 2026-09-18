<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCursoRequest;
use App\Http\Requests\UpdateCursoRequest;
use App\Http\Resources\CursoResource;
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
        return CursoResource::collection($this->service->listar($request->all()));
    }

    public function store(StoreCursoRequest $request)
    {
        $curso = $this->service->crear($request->validated());

        return (new CursoResource($curso))
            ->response()
            ->setStatusCode(201)
            ->header('Location', route('cursos.show', $curso));
    }

    public function show(Curso $curso)
    {
        return new CursoResource($curso->load(['profesor', 'categorias']));
    }

    public function update(UpdateCursoRequest $request, Curso $curso)
    {
        $curso = $this->service->actualizar($curso, $request->validated());
        return new CursoResource($curso);
    }

    public function destroy(Curso $curso)
    {
        $this->service->eliminar($curso);
        return response()->json(null, 204);
    }
}