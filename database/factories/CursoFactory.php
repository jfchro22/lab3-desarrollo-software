<?php

namespace Database\Factories;

use App\Models\Profesor;
use Illuminate\Database\Eloquent\Factories\Factory;

class CursoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nombre' => fake()->words(3, true),
            'creditos' => fake()->numberBetween(1, 4),
            'profesor_id' => Profesor::factory(),
        ];
    }
}