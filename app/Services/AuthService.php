<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\NewAccessToken;

class AuthService
{
    private const MAX_INTENTOS = 5;
    private const DECAY_SEGUNDOS = 60;
    private const HORAS_EXPIRACION_TOKEN = 2;

    public function registrar(array $datos): User
    {
        // El registro público siempre crea usuarios con rol estudiante y sin vínculo.
        // Los roles admin/profesor y los vínculos con estudiante/profesor los asigna el seeder o un admin.
        return User::create([
            'name'     => $datos['name'],
            'email'    => $datos['email'],
            'password' => $datos['password'],
            'role'     => 'estudiante',
        ]);
    }

    public function login(string $email, string $password, string $ip): array
    {
        $key = $this->rateLimitKey($email, $ip);

        if (RateLimiter::tooManyAttempts($key, self::MAX_INTENTOS)) {
            throw new BusinessRuleException(
                'Demasiados intentos de inicio de sesión. Intente de nuevo en unos minutos.',
                'demasiados_intentos'
            );
        }

        $usuario = User::where('email', $email)->first();

        // Mismo mensaje para usuario inexistente y contraseña incorrecta,
        // para no permitir enumerar cuentas.
        if (! $usuario || ! Hash::check($password, $usuario->password)) {
            RateLimiter::hit($key, self::DECAY_SEGUNDOS);

            throw new BusinessRuleException(
                'Credenciales inválidas.',
                'credenciales_invalidas'
            );
        }

        RateLimiter::clear($key);

        $expiracion = now()->addHours(self::HORAS_EXPIRACION_TOKEN);

        /** @var NewAccessToken $token */
        $token = $usuario->createToken('api-token', ['*'], $expiracion);

        return [
            'usuario'   => $usuario,
            'token'     => $token->plainTextToken,
            'expira_en' => $expiracion->toIso8601String(),
        ];
    }

    public function logout(User $usuario): void
    {
        $usuario->currentAccessToken()->delete();
    }

    private function rateLimitKey(string $email, string $ip): string
    {
        return 'login:' . $ip . '|' . $email;
    }
}