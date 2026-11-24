<?php

namespace Tests\Feature;

use Database\Seeders\UsuarioSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntornoProduccionTest extends TestCase
{
    use RefreshDatabase;

    public function test_en_produccion_no_se_siembran_usuarios_de_demostracion(): void
    {
        $this->app['env'] = 'production';
        putenv('ADMIN_EMAIL');
        putenv('ADMIN_PASSWORD');

        // Se ejecuta el seeder directo: el comando db:seed pide confirmación en producción.
        $this->app->make(UsuarioSeeder::class)->run();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_en_produccion_el_administrador_sale_de_variables_de_entorno(): void
    {
        $this->app['env'] = 'production';
        putenv('ADMIN_EMAIL=admin-prod@ejemplo.test');
        putenv('ADMIN_PASSWORD=clave-solo-de-prueba-1');

        try {
            $this->app->make(UsuarioSeeder::class)->run();
        } finally {
            putenv('ADMIN_EMAIL');
            putenv('ADMIN_PASSWORD');
        }

        $this->assertDatabaseHas('users', ['email' => 'admin-prod@ejemplo.test', 'role' => 'admin']);
        $this->assertDatabaseCount('users', 1);
    }
}
