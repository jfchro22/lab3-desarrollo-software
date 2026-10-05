<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Estudiante;
use App\Models\Matricula;
use App\Models\Profesor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiSeguridadTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol, array $extra = []): User
    {
        return User::factory()->create(array_merge(['role' => $rol], $extra));
    }

    public function test_login_exitoso_devuelve_200_con_la_estructura_esperada(): void
    {
        $this->usuario('estudiante', ['email' => 'e@test.com', 'password' => 'Clave1234']);

        $this->postJson('/api/login', ['email' => 'e@test.com', 'password' => 'Clave1234'])
            ->assertOk()
            ->assertJsonStructure([
                'usuario' => ['id', 'name', 'email', 'role'],
                'token',
                'expira_en',
            ]);
    }

    public function test_login_fallido_responde_401_sin_distinguir_usuario_inexistente_de_clave_incorrecta(): void
    {
        $this->usuario('estudiante', ['email' => 'e@test.com', 'password' => 'Clave1234']);

        $claveMala = $this->postJson('/api/login', ['email' => 'e@test.com', 'password' => 'Incorrecta1']);
        $inexistente = $this->postJson('/api/login', ['email' => 'nadie@test.com', 'password' => 'Incorrecta1']);

        $claveMala->assertStatus(401)->assertJson(['rule_code' => 'credenciales_invalidas']);
        $inexistente->assertStatus(401)->assertJson(['rule_code' => 'credenciales_invalidas']);
        $this->assertSame($claveMala->json('message'), $inexistente->json('message'));
    }

    public function test_el_sexto_intento_fallido_de_login_responde_429(): void
    {
        $this->usuario('estudiante', ['email' => 'e@test.com', 'password' => 'Clave1234']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'e@test.com', 'password' => 'Incorrecta1'])
                ->assertStatus(401);
        }

        $this->postJson('/api/login', ['email' => 'e@test.com', 'password' => 'Incorrecta1'])
            ->assertStatus(429)
            ->assertJson(['rule_code' => 'demasiados_intentos']);
    }

    public function test_ruta_protegida_sin_token_responde_401(): void
    {
        $this->getJson('/api/cursos')->assertUnauthorized();
    }

    public function test_estudiante_no_puede_crear_cursos_y_recibe_403(): void
    {
        Sanctum::actingAs($this->usuario('estudiante'));

        $this->postJson('/api/cursos', [
            'nombre' => 'Curso no autorizado',
            'creditos' => 3,
            'profesor_id' => 1,
            'categoria_ids' => [1],
        ])
            ->assertForbidden()
            ->assertJson(['rule_code' => 'acceso_no_autorizado']);
    }

    public function test_admin_puede_crear_cursos_y_recibe_201_con_la_estructura_esperada(): void
    {
        $profesor = Profesor::factory()->create();
        $categoria = Categoria::factory()->create();
        Sanctum::actingAs($this->usuario('admin'));

        $this->postJson('/api/cursos', [
            'nombre' => 'Curso API',
            'creditos' => 4,
            'profesor_id' => $profesor->id,
            'categoria_ids' => [$categoria->id],
        ])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['id', 'nombre', 'creditos']]);
    }

    public function test_estudiante_solo_ve_sus_propias_matriculas(): void
    {
        $yo = Estudiante::factory()->create();
        $otro = Estudiante::factory()->create();
        Matricula::factory()->count(2)->create(['estudiante_id' => $yo->id]);
        Matricula::factory()->count(3)->create(['estudiante_id' => $otro->id]);

        Sanctum::actingAs($this->usuario('estudiante', ['estudiante_id' => $yo->id]));

        $this->getJson('/api/matriculas')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_estudiante_no_puede_ver_la_matricula_de_otro_y_recibe_403(): void
    {
        $yo = Estudiante::factory()->create();
        $matriculaAjena = Matricula::factory()->create();

        Sanctum::actingAs($this->usuario('estudiante', ['estudiante_id' => $yo->id]));

        $this->getJson("/api/matriculas/{$matriculaAjena->id}")->assertForbidden();
    }

    public function test_logout_revoca_el_token(): void
    {
        $this->usuario('estudiante', ['email' => 'e@test.com', 'password' => 'Clave1234']);

        $token = $this->postJson('/api/login', ['email' => 'e@test.com', 'password' => 'Clave1234'])
            ->json('token');

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
       public function test_403_de_autorizacion_responde_limpio_sin_traza(): void
    {
        $yo = Estudiante::factory()->create();
        $matriculaAjena = Matricula::factory()->create();

        Sanctum::actingAs($this->usuario('estudiante', ['estudiante_id' => $yo->id]));

        $respuesta = $this->getJson("/api/matriculas/{$matriculaAjena->id}")
            ->assertForbidden();

        // El body debe traer únicamente "message" — ni exception, ni file, ni trace.
        $this->assertSame(['message'], array_keys($respuesta->json()));
    }
}