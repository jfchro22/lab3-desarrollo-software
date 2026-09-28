<?php

namespace Tests\Unit;

use App\Exceptions\BusinessRuleException;
use App\Models\Curso;
use App\Models\Estudiante;
use App\Models\Matricula;
use App\Models\User;
use App\Services\MatriculaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatriculaServiceTest extends TestCase
{
    use RefreshDatabase;

    private MatriculaService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(MatriculaService::class);
    }

    /** Doble de la persona usuaria: no se persiste en la base de datos. */
    private function actor(string $rol, array $extra = []): User
    {
        return User::factory()->make(array_merge(['role' => $rol], $extra));
    }

    private function assertRegla(string $codigo, callable $accion): void
    {
        try {
            $accion();
        } catch (BusinessRuleException $e) {
            $this->assertSame($codigo, $e->getRuleCode());

            return;
        }

        $this->fail("Se esperaba una BusinessRuleException con código {$codigo}.");
    }

    public function test_admin_puede_crear_una_matricula_camino_feliz(): void
    {
        $curso = Curso::factory()->create();
        $estudiante = Estudiante::factory()->create();

        $matricula = $this->service->crear($this->actor('admin'), [
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->toDateString(),
        ]);

        $this->assertDatabaseHas('matriculas', [
            'id' => $matricula->id,
            'curso_id' => $curso->id,
            'estudiante_id' => $estudiante->id,
        ]);
    }

    public function test_rechaza_matricula_cuando_el_curso_alcanzo_el_cupo_maximo(): void
    {
        $curso = Curso::factory()->create();
        Matricula::factory()->count(30)->create(['curso_id' => $curso->id]);
        $estudiante = Estudiante::factory()->create();

        $this->assertRegla('cupo_maximo_alcanzado', fn () => $this->service->crear($this->actor('admin'), [
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->toDateString(),
        ]));
    }

    public function test_rechaza_matricula_cuando_el_estudiante_supera_el_limite_de_carga(): void
    {
        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->count(6)->create(['estudiante_id' => $estudiante->id]);
        $curso = Curso::factory()->create();

        $this->assertRegla('limite_carga_academica', fn () => $this->service->crear($this->actor('admin'), [
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->toDateString(),
        ]));
    }

    public function test_rechaza_registrar_nota_de_una_matricula_no_iniciada(): void
    {
        $matricula = Matricula::factory()->create(['fecha_matricula' => now()->addDays(3)->toDateString()]);

        $this->assertRegla('matricula_no_iniciada', fn () => $this->service->actualizarNota(
            $this->actor('admin'),
            $matricula,
            ['nota' => 90]
        ));
    }

    public function test_caso_limite_permite_la_matricula_numero_treinta_del_curso(): void
    {
        $curso = Curso::factory()->create();
        Matricula::factory()->count(29)->create(['curso_id' => $curso->id]);
        $estudiante = Estudiante::factory()->create();

        $this->service->crear($this->actor('admin'), [
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->toDateString(),
        ]);

        $this->assertSame(30, $curso->matriculas()->count());
    }

    public function test_caso_limite_permite_el_sexto_curso_de_un_estudiante(): void
    {
        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->count(5)->create(['estudiante_id' => $estudiante->id]);
        $curso = Curso::factory()->create();

        $this->service->crear($this->actor('admin'), [
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->toDateString(),
        ]);

        $this->assertSame(6, Matricula::where('estudiante_id', $estudiante->id)->count());
    }

    public function test_caso_limite_permite_registrar_nota_si_el_curso_inicia_hoy(): void
    {
        $matricula = Matricula::factory()->create(['fecha_matricula' => now()->toDateString()]);

        $this->service->actualizarNota($this->actor('admin'), $matricula, ['nota' => 88]);

        $this->assertEquals(88, $matricula->fresh()->nota);
    }

    public function test_servicio_rechaza_que_un_estudiante_matricule_a_otro_estudiante(): void
    {
        $curso = Curso::factory()->create();
        $yo = Estudiante::factory()->create();
        $otro = Estudiante::factory()->create();

        $this->assertRegla('acceso_no_autorizado', fn () => $this->service->crear(
            $this->actor('estudiante', ['estudiante_id' => $yo->id]),
            [
                'estudiante_id' => $otro->id,
                'curso_id' => $curso->id,
                'fecha_matricula' => now()->toDateString(),
            ]
        ));

        $this->assertDatabaseCount('matriculas', 0);
    }

    public function test_servicio_rechaza_que_un_profesor_cree_matriculas(): void
    {
        $curso = Curso::factory()->create();
        $estudiante = Estudiante::factory()->create();

        $this->assertRegla('acceso_no_autorizado', fn () => $this->service->crear(
            $this->actor('profesor', ['profesor_id' => $curso->profesor_id]),
            [
                'estudiante_id' => $estudiante->id,
                'curso_id' => $curso->id,
                'fecha_matricula' => now()->toDateString(),
            ]
        ));
    }

    public function test_servicio_rechaza_que_un_estudiante_vea_la_matricula_de_otro(): void
    {
        $yo = Estudiante::factory()->create();
        $matriculaAjena = Matricula::factory()->create();

        $this->assertRegla('acceso_no_autorizado', fn () => $this->service->obtener(
            $this->actor('estudiante', ['estudiante_id' => $yo->id]),
            $matriculaAjena
        ));
    }
}