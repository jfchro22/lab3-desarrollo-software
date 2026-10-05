<?php

namespace Tests\Unit;

use App\Exceptions\BusinessRuleException;
use App\Models\Curso;
use App\Models\User;
use App\Repositories\CursoRepository;
use App\Services\CursoService;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class CursoServiceTest extends TestCase
{
    private CursoRepository $repositorio;
    private CursoService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repositorio = Mockery::mock(CursoRepository::class);
        $this->service = new CursoService($this->repositorio);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function actor(string $rol): User
    {
        return User::factory()->make(['id' => 1, 'role' => $rol]);
    }

    /** Construye un Curso con id, sin pasar por fillable ni por la base de datos. */
    private function curso(int $id): Curso
    {
        $curso = new Curso();
        $curso->id = $id;

        return $curso;
    }

    public function test_admin_puede_crear_un_curso_camino_feliz(): void
    {
        $datos = [
            'nombre' => 'Bases de datos',
            'creditos' => 4,
            'profesor_id' => 1,
            'categoria_ids' => [1],
        ];
        $cursoEsperado = $this->curso(1);

        $this->repositorio->shouldReceive('crear')
            ->once()
            ->with($datos)
            ->andReturn($cursoEsperado);

        $resultado = $this->service->crear($this->actor('admin'), $datos);

        $this->assertSame($cursoEsperado, $resultado);
    }

    public function test_rechaza_eliminar_un_curso_con_matriculas_activas(): void
    {
        $curso = $this->curso(5);

        $this->repositorio->shouldReceive('tieneMatriculas')->once()->with($curso)->andReturn(true);
        $this->repositorio->shouldNotReceive('eliminar');

        try {
            $this->service->eliminar($this->actor('admin'), $curso);
            $this->fail('Se esperaba una BusinessRuleException.');
        } catch (BusinessRuleException $e) {
            $this->assertSame('curso_con_matriculas_activas', $e->getRuleCode());
        }
    }

    public function test_admin_puede_eliminar_un_curso_sin_matriculas(): void
    {
        $curso = $this->curso(6);

        $this->repositorio->shouldReceive('tieneMatriculas')->once()->with($curso)->andReturn(false);
        $this->repositorio->shouldReceive('eliminar')->once()->with($curso);

        $this->service->eliminar($this->actor('admin'), $curso);

        $this->assertTrue(true); // Las expectativas del mock se verifican en tearDown.
    }

    public function test_invocacion_directa_al_servicio_por_un_estudiante_es_rechazada(): void
    {
        $this->repositorio->shouldNotReceive('crear');

        try {
            $this->service->crear($this->actor('estudiante'), [
                'nombre' => 'Curso no autorizado',
                'creditos' => 3,
                'profesor_id' => 1,
                'categoria_ids' => [1],
            ]);
            $this->fail('Se esperaba una BusinessRuleException.');
        } catch (BusinessRuleException $e) {
            $this->assertSame('acceso_no_autorizado', $e->getRuleCode());
        }
    }

    public function test_caso_limite_per_page_se_acota_entre_1_y_50(): void
    {
        $paginadorFalso = Mockery::mock(LengthAwarePaginator::class);

        $this->repositorio->shouldReceive('paginar')
            ->once()
            ->with(['per_page' => 999], 50)
            ->andReturn($paginadorFalso);

        $this->repositorio->shouldReceive('paginar')
            ->once()
            ->with(['per_page' => -5], 1)
            ->andReturn($paginadorFalso);

        $this->service->listar($this->actor('admin'), ['per_page' => 999]);
        $this->service->listar($this->actor('admin'), ['per_page' => -5]);

        $this->assertTrue(true); // Las expectativas del mock (paginar con 50 y con 1) se verifican en tearDown.
    }

    public function test_admin_puede_actualizar_un_curso(): void
    {
        $curso = $this->curso(7);
        $cursoActualizado = $this->curso(7);

        $this->repositorio->shouldReceive('actualizar')
            ->once()
            ->with($curso, ['creditos' => 5])
            ->andReturn($cursoActualizado);

        $resultado = $this->service->actualizar($this->actor('admin'), $curso, ['creditos' => 5]);

        $this->assertSame($cursoActualizado, $resultado);
    }

    public function test_estudiante_no_puede_actualizar_un_curso(): void
    {
        $curso = $this->curso(8);
        $this->repositorio->shouldNotReceive('actualizar');

        try {
            $this->service->actualizar($this->actor('estudiante'), $curso, ['creditos' => 5]);
            $this->fail('Se esperaba una BusinessRuleException.');
        } catch (BusinessRuleException $e) {
            $this->assertSame('acceso_no_autorizado', $e->getRuleCode());
        }
    }
}