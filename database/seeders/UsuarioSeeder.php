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
        // En producción NUNCA se siembran credenciales conocidas: el único usuario posible es el
        // administrador inicial, y su correo y contraseña llegan por variables de entorno.
        if (app()->environment('production')) {
            $this->crearAdministradorDeProduccion();

            return;
        }

        // Usuarios de demostración: SOLO para desarrollo y pruebas (nunca se ejecutan en producción).
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

    private function crearAdministradorDeProduccion(): void
    {
        $correo = env('ADMIN_EMAIL');
        $clave = env('ADMIN_PASSWORD');

        if (blank($correo) || blank($clave)) {
            $this->command?->warn('ADMIN_EMAIL y ADMIN_PASSWORD no están definidas: no se crea administrador.');

            return;
        }

        User::updateOrCreate(
            ['email' => $correo],
            ['name' => 'Administrador', 'password' => $clave, 'role' => 'admin']
        );
    }
}
