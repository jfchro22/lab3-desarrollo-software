<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Profesor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Las tres pruebas equivalentes del estudio comparativo (mismas que en NestJS y ASP.NET Core).
 */
class ComparativoContratoTest extends TestCase
{
    use RefreshDatabase;

    private function token(): string
    {
        User::factory()->create(['email' => 'admin@test.com', 'password' => 'Clave1234', 'role' => 'admin']);

        return $this->postJson('/api/login', ['email' => 'admin@test.com', 'password' => 'Clave1234'])->json('token');
    }

    public function test_1_login_200_con_token_401_credenciales_incorrectas_422_datos_invalidos(): void
    {
        User::factory()->create(['email' => 'admin@test.com', 'password' => 'Clave1234', 'role' => 'admin']);

        $this->postJson('/api/login', ['email' => 'admin@test.com', 'password' => 'Clave1234'])
            ->assertStatus(200)
            ->assertJsonStructure(['token', 'usuario' => ['id', 'email', 'role']])
            ->assertJsonPath('usuario.role', 'admin');
        $this->postJson('/api/login', ['email' => 'admin@test.com', 'password' => 'mala'])->assertStatus(401);
        $this->postJson('/api/login', ['email' => 'no-es-correo'])->assertStatus(422);
    }

    public function test_2_listado_401_sin_token_y_200_paginado_con_token(): void
    {
        $this->getJson('/api/cursos')->assertStatus(401);

        $token = $this->token();
        $this->withToken($token)->getJson('/api/cursos?page=1&per_page=10')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'per_page', 'total', 'last_page']])
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 10);
    }

    public function test_3_creacion_422_invalida_201_con_location_y_404_inexistente(): void
    {
        $token = $this->token();
        $profesor = Profesor::factory()->create();
        $categoria = Categoria::factory()->create();

        $this->withToken($token)->postJson('/api/cursos', ['nombre' => 'x', 'creditos' => 9])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nombre', 'creditos']);

        $r = $this->withToken($token)->postJson('/api/cursos', [
            'nombre' => 'Curso de prueba', 'creditos' => 3,
            'profesor_id' => $profesor->id, 'categoria_ids' => [$categoria->id],
        ])->assertStatus(201);
        $this->assertMatchesRegularExpression('#/api/cursos/\d+$#', $r->headers->get('Location'));

        $this->withToken($token)->getJson('/api/cursos/99999')->assertStatus(404);
        $this->withToken($token)->deleteJson('/api/cursos/'.$r->json('data.id'))->assertStatus(204);
    }
}
