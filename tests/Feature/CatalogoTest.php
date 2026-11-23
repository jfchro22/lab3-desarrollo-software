<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Profesor;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CatalogoTest extends TestCase
{
    use RefreshDatabase;

    public function test_los_catalogos_exigen_autenticacion(): void
    {
        $this->getJson('/api/profesores')->assertStatus(401);
        $this->getJson('/api/categorias')->assertStatus(401);
    }

    public function test_lista_profesores_ordenados_por_nombre_para_cualquier_rol(): void
    {
        Profesor::factory()->create(['nombre' => 'Zeta Profesor']);
        Profesor::factory()->create(['nombre' => 'Alfa Profesor']);
        Sanctum::actingAs(User::factory()->create(['role' => 'estudiante']));

        $this->getJson('/api/profesores')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.nombre', 'Alfa Profesor')
            ->assertJsonStructure(['data' => [['id', 'nombre']]]);
    }

    public function test_lista_categorias_ordenadas_por_nombre(): void
    {
        Categoria::factory()->create(['nombre' => 'Zeta']);
        Categoria::factory()->create(['nombre' => 'Alfa']);
        Sanctum::actingAs(User::factory()->create(['role' => 'profesor']));

        $this->getJson('/api/categorias')
            ->assertOk()
            ->assertJsonPath('data.0.nombre', 'Alfa')
            ->assertJsonStructure(['data' => [['id', 'nombre']]]);
    }

    public function test_el_seeder_principal_crea_los_usuarios_de_demostracion(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', ['email' => 'admin@test.com', 'role' => 'admin']);
        $this->assertDatabaseHas('users', ['email' => 'profesor@test.com', 'role' => 'profesor']);
        $this->assertDatabaseHas('users', ['email' => 'estudiante@test.com', 'role' => 'estudiante']);
    }
}
