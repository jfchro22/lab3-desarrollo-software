<?php

namespace Tests\Unit;

use App\Exceptions\BusinessRuleException;
use App\Models\Categoria;
use App\Models\Curso;
use App\Models\Matricula;
use App\Models\Profesor;
use App\Models\User;
use App\Services\CursoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CursoServiceTest extends TestCase
{
    use RefreshDatabase;

    private CursoService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(CursoService::class);
    }

    /** Doble de la persona usuaria: no se persiste en la base de datos. */
    private function actor(string $rol): User
    {
        return User::factory()->make(['role' => $rol]);
    }

    public function test_admin_puede_crear_un_curso_con_sus_categorias_camino_feliz(): void
    {
        $profesor = Profesor::factory()->create();
        $categoria = Categoria::factory()->create();

        $curso = $this->service->crear($this->actor('admin'), [
            'nombre' => 'Bases de datos',
            'creditos' => 4,
            'profesor_id' => $profesor->id,
            'categoria_ids' => [$categoria->id],
        ]);

        $this->assertDatabaseHas('cursos', ['id' => $curso->id, 'nombre' => 'Bases de datos']);
        $this->assertDatabaseHas('curso_categoria', ['curso_id' => $curso->id, 'categoria_id' => $categoria->id]);
    }

    public function test_rechaza_eliminar_un_curso_con_matriculas_activas(): void
    {
        $curso = Curso::factory()->create();
        Matricula::factory()->create(['curso_id' => $curso->id]);

        try {
            $this->service->eliminar($this->actor('admin'), $curso);
            $this->fail('Se esperaba una BusinessRuleException.');
        } catch (BusinessRuleException $e) {
            $this->assertSame('curso_con_matriculas_activas', $e->getRuleCode());
        }

        $this->assertDatabaseHas('cursos', ['id' => $curso->id]);
    }

    public function test_invocacion_directa_al_servicio_por_un_estudiante_es_rechazada(): void
    {
        $profesor = Profesor::factory()->create();
        $categoria = Categoria::factory()->create();

        try {
            $this->service->crear($this->actor('estudiante'), [
                'nombre' => 'Curso no autorizado',
                'creditos' => 3,
                'profesor_id' => $profesor->id,
                'categoria_ids' => [$categoria->id],
            ]);
            $this->fail('Se esperaba una BusinessRuleException.');
        } catch (BusinessRuleException $e) {
            $this->assertSame('acceso_no_autorizado', $e->getRuleCode());
        }

        $this->assertDatabaseCount('cursos', 0);
    }

    public function test_caso_limite_per_page_se_acota_entre_1_y_50(): void
    {
        Curso::factory()->count(3)->create();

        $alto = $this->service->listar($this->actor('admin'), ['per_page' => 999]);
        $negativo = $this->service->listar($this->actor('admin'), ['per_page' => -5]);

        $this->assertSame(50, $alto->perPage());
        $this->assertSame(1, $negativo->perPage());
    }
}