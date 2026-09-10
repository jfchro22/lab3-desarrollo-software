<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
use App\Models\Curso;

Route::get('/reportes', function () {
    return response()->json([
        'cursos_4_creditos_o_mas' => Curso::conCreditosMinimos(4)->get(),
        'matriculas_por_curso' => Curso::select('cursos.nombre')
            ->join('matriculas', 'matriculas.curso_id', '=', 'cursos.id')
            ->selectRaw('count(matriculas.id) as total_estudiantes')
            ->groupBy('cursos.id', 'cursos.nombre')
            ->get(),
    ]);
});