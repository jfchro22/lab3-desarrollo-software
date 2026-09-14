<?php

namespace Tests\Feature;

use App\Exceptions\BusinessRuleException;
use App\Models\Categoria;
use App\Models\Curso;
use App\Models\Estudiante;
use App\Models\Matricula;
use App\Models\Profesor;
use App\Services\CursoService;
use App\Services\MatriculaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReglasDeNegocioTest extends TestCase
{
    use RefreshDatabase;

    private function crearCursoBasico(): Curso
    {
        $profesor = Profesor::factory()->create();
        $categoria = Categoria::factory()->create();

        return app(CursoService::class)->crear([
            'nombre' => 'Curso de prueba ' . fake()->unique()->numberBetween(1000, 9999),
            'creditos' => 3,
            'profesor_id' => $profesor->id,
            'categoria_ids' => [$categoria->id],
        ]);
    }

    public function test_no_permite_eliminar_curso_con_matriculas_activas(): void
    {
        $curso = $this->crearCursoBasico();
        $estudiante = Estudiante::factory()->create();

        app(MatriculaService::class)->crear([
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->subDay()->toDateString(),
        ]);

        $this->expectException(BusinessRuleException::class);
        app(CursoService::class)->eliminar($curso);
    }

    public function test_no_permite_matricular_si_el_curso_alcanzo_el_cupo_maximo(): void
    {
        $curso = $this->crearCursoBasico();

        Matricula::factory()->count(30)->create(['curso_id' => $curso->id]);

        $estudianteNuevo = Estudiante::factory()->create();

        $this->expectException(BusinessRuleException::class);
        app(MatriculaService::class)->crear([
            'estudiante_id' => $estudianteNuevo->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->toDateString(),
        ]);
    }

    public function test_no_permite_matricular_a_un_estudiante_en_mas_de_seis_cursos(): void
    {
        $estudiante = Estudiante::factory()->create();
        Matricula::factory()->count(6)->create(['estudiante_id' => $estudiante->id]);

        $cursoExtra = $this->crearCursoBasico();

        $this->expectException(BusinessRuleException::class);
        app(MatriculaService::class)->crear([
            'estudiante_id' => $estudiante->id,
            'curso_id' => $cursoExtra->id,
            'fecha_matricula' => now()->toDateString(),
        ]);
    }

    public function test_no_permite_registrar_nota_de_una_matricula_no_iniciada(): void
    {
        $curso = $this->crearCursoBasico();
        $estudiante = Estudiante::factory()->create();

        $matricula = app(MatriculaService::class)->crear([
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'fecha_matricula' => now()->addDay()->toDateString(),
        ]);

        $this->expectException(BusinessRuleException::class);
        app(MatriculaService::class)->actualizarNota($matricula, ['nota' => 90]);
    }
}