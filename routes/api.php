<?php

use App\Http\Controllers\CursoController;
use App\Http\Controllers\MatriculaController;
use Illuminate\Support\Facades\Route;

Route::apiResource('cursos.matriculas', MatriculaController::class)->shallow();
Route::apiResource('cursos', CursoController::class);
Route::apiResource('matriculas', MatriculaController::class);