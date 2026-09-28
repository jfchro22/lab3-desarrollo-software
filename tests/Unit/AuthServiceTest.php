<?php

namespace Tests\Unit;

use App\Exceptions\BusinessRuleException;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_correcto_devuelve_token_y_limpia_el_contador_de_intentos(): void
    {
        User::factory()->create(['email' => 'a@test.com', 'password' => 'Clave1234']);

        RateLimiter::shouldReceive('tooManyAttempts')->once()->andReturn(false);
        RateLimiter::shouldReceive('clear')->once();
        RateLimiter::shouldReceive('hit')->never();

        $resultado = app(AuthService::class)->login('a@test.com', 'Clave1234', '127.0.0.1');

        $this->assertArrayHasKey('token', $resultado);
        $this->assertArrayHasKey('expira_en', $resultado);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_login_bloqueado_por_demasiados_intentos_no_emite_token(): void
    {
        User::factory()->create(['email' => 'a@test.com', 'password' => 'Clave1234']);

        RateLimiter::shouldReceive('tooManyAttempts')->once()->andReturn(true);
        RateLimiter::shouldReceive('hit')->never();
        RateLimiter::shouldReceive('clear')->never();

        try {
            app(AuthService::class)->login('a@test.com', 'Clave1234', '127.0.0.1');
            $this->fail('Se esperaba una BusinessRuleException.');
        } catch (BusinessRuleException $e) {
            $this->assertSame('demasiados_intentos', $e->getRuleCode());
        }

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_usuario_inexistente_y_clave_incorrecta_dan_el_mismo_error(): void
    {
        User::factory()->create(['email' => 'a@test.com', 'password' => 'Clave1234']);

        RateLimiter::shouldReceive('tooManyAttempts')->twice()->andReturn(false);
        RateLimiter::shouldReceive('hit')->twice();

        $mensajes = [];

        foreach ([['a@test.com', 'Incorrecta1'], ['nadie@test.com', 'Incorrecta1']] as [$email, $clave]) {
            try {
                app(AuthService::class)->login($email, $clave, '127.0.0.1');
                $this->fail('Se esperaba una BusinessRuleException.');
            } catch (BusinessRuleException $e) {
                $mensajes[] = $e->getRuleCode() . '|' . $e->getMessage();
            }
        }

        $this->assertSame($mensajes[0], $mensajes[1]);
    }

    public function test_logout_revoca_el_token_actual(): void
    {
        $usuario = User::factory()->create();
        $token = $usuario->createToken('api-token');
        $usuario->withAccessToken($token->accessToken);

        app(AuthService::class)->logout($usuario);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_registro_siempre_crea_rol_estudiante_y_guarda_la_clave_derivada(): void
    {
        $usuario = app(AuthService::class)->registrar([
            'name' => 'Persona Nueva',
            'email' => 'nueva@test.com',
            'password' => 'Clave1234',
            'role' => 'admin',
        ]);

        $this->assertSame('estudiante', $usuario->role);
        $this->assertNotSame('Clave1234', $usuario->password);
        $this->assertTrue(Hash::check('Clave1234', $usuario->password));
    }
}