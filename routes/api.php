<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CursoController;
use App\Http\Controllers\MatriculaController;
use Illuminate\Support\Facades\Route;

// Rutas públicas
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas por token
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Lectura: cualquier rol autenticado
    Route::apiResource('cursos', CursoController::class)->only(['index', 'show']);
    Route::apiResource('cursos.matriculas', MatriculaController::class)->shallow()->only(['index']);
    Route::apiResource('matriculas', MatriculaController::class)->only(['index', 'show']);

    // Solo admin: escribir cursos y eliminar matrículas
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('cursos', CursoController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('matriculas', MatriculaController::class)->only(['destroy']);
    });

    // Admin y estudiante: crear matrícula
    Route::middleware('role:admin,estudiante')->group(function () {
        Route::apiResource('cursos.matriculas', MatriculaController::class)->shallow()->only(['store']);
        Route::apiResource('matriculas', MatriculaController::class)->only(['store']);
    });

    // Admin y profesor: registrar nota
    Route::middleware('role:admin,profesor')->group(function () {
        Route::apiResource('matriculas', MatriculaController::class)->only(['update']);
    });
});