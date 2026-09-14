<?php

namespace Database\Factories;

use App\Models\Curso;
use App\Models\Estudiante;
use App\Models\Matricula;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Matricula>
 */
class MatriculaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'estudiante_id' => Estudiante::factory(),
            'curso_id' => Curso::factory(),
            'fecha_matricula' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'nota' => fake()->randomFloat(2, 60, 99),
        ];
    }
}