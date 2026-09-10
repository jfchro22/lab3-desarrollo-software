<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Curso;
use App\Models\Estudiante;
use App\Models\Profesor;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $profesores = Profesor::factory(5)->create();
        $categorias = Categoria::factory(6)->create();
        $cursos = Curso::factory(10)->create();
        $estudiantes = Estudiante::factory(20)->create();

        foreach ($cursos as $curso) {
            $curso->categorias()->attach(
                $categorias->random(rand(1, 2))->pluck('id')->toArray()
            );
        }

        foreach ($estudiantes as $estudiante) {
            $cursosElegidos = $cursos->random(rand(2, 4));
            foreach ($cursosElegidos as $curso) {
                $estudiante->cursos()->attach($curso->id, [
                    'nota' => fake()->randomFloat(2, 60, 100),
                    'fecha_matricula' => now(),
                ]);
            }
        }
    }
}