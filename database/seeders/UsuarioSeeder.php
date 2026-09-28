<?php

namespace Database\Seeders;

use App\Models\Estudiante;
use App\Models\Profesor;
use App\Models\User;
use Illuminate\Database\Seeder;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name'     => 'Administrador',
                'password' => 'Admin1234',
                'role'     => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'profesor@test.com'],
            [
                'name'        => 'Profesor Demo',
                'password'    => 'Profesor1234',
                'role'        => 'profesor',
                'profesor_id' => Profesor::query()->value('id'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'estudiante@test.com'],
            [
                'name'          => 'Estudiante Demo',
                'password'      => 'Estudiante1234',
                'role'          => 'estudiante',
                'estudiante_id' => Estudiante::query()->value('id'),
            ]
        );
    }
}