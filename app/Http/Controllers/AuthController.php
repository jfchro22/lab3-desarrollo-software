<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\Request;

/**
 * @tags Autenticación
 */
class AuthController extends Controller
{
    public function __construct(private AuthService $service)
    {
    }

    /**
     * Registrar usuario
     *
     * Crea un nuevo usuario del sistema con un rol (admin, profesor o estudiante).
     */
    public function register(RegisterRequest $request)
    {
        $usuario = $this->service->registrar($request->validated());

        return (new UserResource($usuario))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Iniciar sesión
     *
     * Autentica al usuario y devuelve un token de API con expiración de 2 horas.
     */
    public function login(LoginRequest $request)
    {
        $resultado = $this->service->login(
            $request->validated('email'),
            $request->validated('password'),
            $request->ip()
        );

        return response()->json([
            'usuario'   => new UserResource($resultado['usuario']),
            'token'     => $resultado['token'],
            'expira_en' => $resultado['expira_en'],
        ]);
    }

    /**
     * Cerrar sesión
     *
     * Revoca el token de API usado en la petición actual.
     */
    public function logout(Request $request)
    {
        $this->service->logout($request->user());

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }
}