<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ProfesorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nombre' => fake()->name(),
            'correo' => fake()->unique()->safeEmail(),
            'especialidad' => fake()->randomElement(['Matemática', 'Programación', 'Bases de Datos', 'Redes', 'Inglés']),
        ];
    }
}