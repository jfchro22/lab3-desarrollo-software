<?php

namespace Tests\Unit;

use App\Exceptions\BusinessRuleException;
use App\Models\Curso;
use App\Models\Matricula;
use App\Models\User;
use App\Repositories\CursoRepository;
use App\Repositories\MatriculaRepository;
use App\Services\MatriculaService;
use Mockery;
use Tests\TestCase;

class MatriculaServiceTest extends TestCase
{
    private MatriculaRepository $repositorio;
    private CursoRepository $cursoRepositorio;
    private MatriculaService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repositorio = Mockery::mock(MatriculaRepository::class);
        $this->cursoRepositorio = Mockery::mock(CursoRepository::class);
        $this->service = new MatriculaService($this->repositorio, $this->cursoRepositorio);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function actor(string $rol, array $extra = []): User
    {
        return User::factory()->make(array_merge(['id' => 1, 'role' => $rol], $extra));
    }

    /** Construye un Curso con id, sin pasar por fillable ni por la base de datos. */
    private function curso(int $id): Curso
    {
        $curso = new Curso();
        $curso->id = $id;

        return $curso;
    }

    /**
     * Construye una Matricula con atributos crudos (setRawAttributes), sin pasar por
     * fillable, sin disparar relaciones mágicas, y sin tocar la base de datos.
     */
    private function matricula(int $id, array $attrs = []): Matricula
    {
        $matricula = new Matricula();
        $matricula->setRawAttributes(array_merge(['id' => $id], $attrs));

        return $matricula;
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
        $curso = $this->curso(10);
        $datos = ['estudiante_id' => 1, 'curso_id' => 10, 'fecha_matricula' => '2026-01-01'];
        $matriculaEsperada = $this->matricula(1);

        $this->cursoRepositorio->shouldReceive('buscarOFallar')->once()->with(10)->andReturn($curso);
        $this->repositorio->shouldReceive('contarPorCurso')->once()->with(10)->andReturn(5);
        $this->repositorio->shouldReceive('contarPorEstudiante')->once()->with(1)->andReturn(2);
        $this->repositorio->shouldReceive('crear')->once()->with($datos)->andReturn($matriculaEsperada);

        $resultado = $this->service->crear($this->actor('admin'), $datos);

        $this->assertSame($matriculaEsperada, $resultado);
    }

    public function test_rechaza_matricula_cuando_el_curso_alcanzo_el_cupo_maximo(): void
    {
        $curso = $this->curso(11);
        $datos = ['estudiante_id' => 1, 'curso_id' => 11, 'fecha_matricula' => '2026-01-01'];

        $this->cursoRepositorio->shouldReceive('buscarOFallar')->once()->with(11)->andReturn($curso);
        $this->repositorio->shouldReceive('contarPorCurso')->once()->with(11)->andReturn(30);
        $this->repositorio->shouldNotReceive('crear');

        $this->assertRegla('cupo_maximo_alcanzado', fn () => $this->service->crear($this->actor('admin'), $datos));
    }

    public function test_rechaza_matricula_cuando_el_estudiante_supera_el_limite_de_carga(): void
    {
        $curso = $this->curso(12);
        $datos = ['estudiante_id' => 2, 'curso_id' => 12, 'fecha_matricula' => '2026-01-01'];

        $this->cursoRepositorio->shouldReceive('buscarOFallar')->once()->with(12)->andReturn($curso);
        $this->repositorio->shouldReceive('contarPorCurso')->once()->with(12)->andReturn(10);
        $this->repositorio->shouldReceive('contarPorEstudiante')->once()->with(2)->andReturn(6);
        $this->repositorio->shouldNotReceive('crear');

        $this->assertRegla('limite_carga_academica', fn () => $this->service->crear($this->actor('admin'), $datos));
    }

    public function test_caso_limite_permite_la_matricula_numero_treinta_del_curso(): void
    {
        $curso = $this->curso(13);
        $datos = ['estudiante_id' => 3, 'curso_id' => 13, 'fecha_matricula' => '2026-01-01'];
        $matriculaEsperada = $this->matricula(2);

        $this->cursoRepositorio->shouldReceive('buscarOFallar')->once()->with(13)->andReturn($curso);
        $this->repositorio->shouldReceive('contarPorCurso')->once()->with(13)->andReturn(29);
        $this->repositorio->shouldReceive('contarPorEstudiante')->once()->with(3)->andReturn(0);
        $this->repositorio->shouldReceive('crear')->once()->with($datos)->andReturn($matriculaEsperada);

        $resultado = $this->service->crear($this->actor('admin'), $datos);

        $this->assertSame($matriculaEsperada, $resultado);
    }

    public function test_caso_limite_permite_el_sexto_curso_de_un_estudiante(): void
    {
        $curso = $this->curso(14);
        $datos = ['estudiante_id' => 4, 'curso_id' => 14, 'fecha_matricula' => '2026-01-01'];
        $matriculaEsperada = $this->matricula(3);

        $this->cursoRepositorio->shouldReceive('buscarOFallar')->once()->with(14)->andReturn($curso);
        $this->repositorio->shouldReceive('contarPorCurso')->once()->with(14)->andReturn(0);
        $this->repositorio->shouldReceive('contarPorEstudiante')->once()->with(4)->andReturn(5);
        $this->repositorio->shouldReceive('crear')->once()->with($datos)->andReturn($matriculaEsperada);

        $resultado = $this->service->crear($this->actor('admin'), $datos);

        $this->assertSame($matriculaEsperada, $resultado);
    }

    public function test_rechaza_registrar_nota_de_una_matricula_no_iniciada(): void
    {
        $matricula = $this->matricula(20, ['fecha_matricula' => now()->addDays(3)->toDateString()]);
        $matricula->setRelation('curso', $this->curso(1));

        $this->repositorio->shouldNotReceive('actualizarNota');

        $this->assertRegla('matricula_no_iniciada', fn () => $this->service->actualizarNota(
            $this->actor('admin'),
            $matricula,
            ['nota' => 90]
        ));
    }

    public function test_caso_limite_permite_registrar_nota_si_el_curso_inicia_hoy(): void
    {
        $matricula = $this->matricula(21, ['fecha_matricula' => now()->toDateString()]);
        $matricula->setRelation('curso', $this->curso(1));
        $matriculaActualizada = $this->matricula(21, ['nota' => 88]);

        $this->repositorio->shouldReceive('actualizarNota')
            ->once()
            ->with($matricula, 88.0)
            ->andReturn($matriculaActualizada);

        $resultado = $this->service->actualizarNota($this->actor('admin'), $matricula, ['nota' => 88]);

        $this->assertSame($matriculaActualizada, $resultado);
    }

    public function test_servicio_rechaza_que_un_estudiante_matricule_a_otro_estudiante(): void
    {
        $this->cursoRepositorio->shouldNotReceive('buscarOFallar');
        $this->repositorio->shouldNotReceive('crear');

        $this->assertRegla('acceso_no_autorizado', fn () => $this->service->crear(
            $this->actor('estudiante', ['estudiante_id' => 1]),
            ['estudiante_id' => 2, 'curso_id' => 1, 'fecha_matricula' => '2026-01-01']
        ));
    }

    public function test_servicio_rechaza_que_un_profesor_cree_matriculas(): void
    {
        $this->cursoRepositorio->shouldNotReceive('buscarOFallar');
        $this->repositorio->shouldNotReceive('crear');

        $this->assertRegla('acceso_no_autorizado', fn () => $this->service->crear(
            $this->actor('profesor', ['profesor_id' => 1]),
            ['estudiante_id' => 2, 'curso_id' => 1, 'fecha_matricula' => '2026-01-01']
        ));
    }

    public function test_servicio_rechaza_que_un_estudiante_vea_la_matricula_de_otro(): void
    {
        $matriculaAjena = $this->matricula(30, ['estudiante_id' => 99]);
        // Se marcan como "ya cargadas" (aunque vacías) para que loadMissing() en el
        // servicio no dispare una consulta real antes de llegar a la autorización.
        $matriculaAjena->setRelation('estudiante', null);
        $matriculaAjena->setRelation('curso', null);

        $this->assertRegla('acceso_no_autorizado', fn () => $this->service->obtener(
            $this->actor('estudiante', ['estudiante_id' => 1]),
            $matriculaAjena
        ));
    }
}