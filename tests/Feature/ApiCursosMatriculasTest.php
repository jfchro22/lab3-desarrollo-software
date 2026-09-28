<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Curso;
use App\Models\Estudiante;
use App\Models\Matricula;
use App\Models\Profesor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiCursosMatriculasTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol, array $extra = []): User
    {
        return User::factory()->create(array_merge(['role' => $rol], $extra));
    }

    // --- Registro de usuario ---

    public function test_registro_valido_crea_usuario_y_devuelve_201(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Persona Nueva',
            'email' => 'nueva@test.com',
            'password' => 'Clave1234',
            'password_confirmation' => 'Clave1234',
        ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'estudiante');
    }

    public function test_registro_con_datos_invalidos_devuelve_422(): void
    {
        $this->postJson('/api/register', [
            'name' => '',
            'email' => 'no-es-un-correo',
            'password' => '123',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    // --- Cursos: index, show, update, destroy ---

    public function test_listar_cursos_admite_filtros_y_devuelve_200(): void
    {
        Curso::factory()->count(3)->create();
        Sanctum::actingAs($this->usuario('estudiante'));

        $this->getJson('/api/cursos?sort=nombre&direction=asc&per_page=10')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_mostrar_un_curso_existente_devuelve_200(): void
    {
        $curso = Curso::factory()->create();
        Sanctum::actingAs($this->usuario('estudiante'));

        $this->getJson("/api/cursos/{$curso->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $curso->id);
    }

    public function test_admin_puede_actualizar_un_curso(): void
    {
        $curso = Curso::factory()->create(['creditos' => 3]);
        Sanctum::actingAs($this->usuario('admin'));

        $this->putJson("/api/cursos/{$curso->id}", ['creditos' => 5])
            ->assertOk()
            ->assertJsonPath('data.creditos', 5);
    }

    public function test_actualizar_curso_con_datos_invalidos_devuelve_422(): void
    {
        $curso = Curso::factory()->create();
        Sanctum::actingAs($this->usuario('admin'));

        $this->putJson("/api/cursos/{$curso->id}", ['creditos' => 999])
            ->assertStatus(422);
    }

    public function test_admin_puede_eliminar_un_curso_sin_matriculas(): void
    {
        $curso = Curso::factory()->create();
        Sanctum::actingAs($this->usuario('admin'));

        $this->deleteJson("/api/cursos/{$curso->id}")->assertNoContent();

        $this->assertDatabaseMissing('cursos', ['id' => $curso->id]);
    }

    public function test_eliminar_curso_con_matriculas_activas_devuelve_409(): void
    {
        $curso = Curso::factory()->create();
        Matricula::factory()->create(['curso_id' => $curso->id]);
        Sanctum::actingAs($this->usuario('admin'));

        $this->deleteJson("/api/cursos/{$curso->id}")
            ->assertStatus(409)
            ->assertJson(['rule_code' => 'curso_con_matriculas_activas']);
    }

    // --- Matrículas: show, update, destroy ---

    public function test_estudiante_puede_registrar_su_propia_matricula(): void
    {
        $curso = Curso::factory()->create();
        $estudiante = Estudiante::factory()->create();
        Sanctum::actingAs($this->usuario('estudiante', ['estudiante_id' => $estudiante->id]));

        $this->postJson('/api/matriculas', [
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->toDateString(),
        ])->assertCreated();
    }

    public function test_crear_matricula_con_datos_invalidos_devuelve_422(): void
    {
        Sanctum::actingAs($this->usuario('admin'));

        $this->postJson('/api/matriculas', [
            'estudiante_id' => 999999,
            'curso_id' => 999999,
        ])->assertStatus(422);
    }

    public function test_estudiante_puede_ver_su_propia_matricula(): void
    {
        $estudiante = Estudiante::factory()->create();
        $matricula = Matricula::factory()->create(['estudiante_id' => $estudiante->id]);
        Sanctum::actingAs($this->usuario('estudiante', ['estudiante_id' => $estudiante->id]));

        $this->getJson("/api/matriculas/{$matricula->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $matricula->id);
    }

    public function test_profesor_puede_registrar_la_nota_de_su_curso(): void
    {
        $profesor = Profesor::factory()->create();
        $curso = Curso::factory()->create(['profesor_id' => $profesor->id]);
        $matricula = Matricula::factory()->create([
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->subDay()->toDateString(),
        ]);
        Sanctum::actingAs($this->usuario('profesor', ['profesor_id' => $profesor->id]));

        $this->putJson("/api/matriculas/{$matricula->id}", ['nota' => 92.5])
            ->assertOk()
            ->assertJsonPath('data.nota', '92.50');
    }

    public function test_profesor_de_otro_curso_no_puede_registrar_la_nota_y_recibe_403(): void
    {
        $matricula = Matricula::factory()->create(['fecha_matricula' => now()->subDay()->toDateString()]);
        $otroProfesor = Profesor::factory()->create();
        Sanctum::actingAs($this->usuario('profesor', ['profesor_id' => $otroProfesor->id]));

        $this->putJson("/api/matriculas/{$matricula->id}", ['nota' => 80])
            ->assertForbidden();
    }

    public function test_admin_puede_eliminar_una_matricula(): void
    {
        $matricula = Matricula::factory()->create();
        Sanctum::actingAs($this->usuario('admin'));

        $this->deleteJson("/api/matriculas/{$matricula->id}")->assertNoContent();

        $this->assertDatabaseMissing('matriculas', ['id' => $matricula->id]);
    }

    public function test_estudiante_no_puede_eliminar_una_matricula_y_recibe_403(): void
    {
        $matricula = Matricula::factory()->create();
        Sanctum::actingAs($this->usuario('estudiante'));

        $this->deleteJson("/api/matriculas/{$matricula->id}")->assertForbidden();
    }

    public function test_matricula_inexistente_devuelve_404_sin_traza(): void
    {
        Sanctum::actingAs($this->usuario('admin'));

        $this->getJson('/api/matriculas/999999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Recurso no encontrado.']);
    }

    // --- Categorías y perfiles de dominio (relaciones) ---

    public function test_un_curso_expone_su_categoria_y_su_profesor(): void
    {
        $profesor = Profesor::factory()->create();
        $categoria = Categoria::factory()->create();
        $curso = Curso::factory()->create(['profesor_id' => $profesor->id]);
        $curso->categorias()->attach($categoria->id);

        $curso->refresh()->load(['profesor', 'categorias']);

        $this->assertSame($profesor->id, $curso->profesor->id);
        $this->assertTrue($curso->categorias->contains($categoria));
    }
}