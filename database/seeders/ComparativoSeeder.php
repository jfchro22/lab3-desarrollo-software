<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Profesor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Datos idénticos para las tres implementaciones del estudio comparativo.
 * Ejecutar: php artisan db:seed --class=ComparativoSeeder
 */
class ComparativoSeeder extends Seeder
{
    public const TOTAL_CURSOS = 1000;

    public function run(): void
    {
        if (Profesor::count() < 5) {
            Profesor::factory(5 - Profesor::count())->create();
        }
        if (Categoria::count() < 6) {
            Categoria::factory(6 - Categoria::count())->create();
        }

        DB::table('users')->updateOrInsert(
            ['email' => 'admin@comparativo.test'],
            ['name' => 'Admin Comparativo', 'password' => Hash::make('Clave1234'), 'role' => 'admin',
             'created_at' => now(), 'updated_at' => now()]
        );

        $profesores = Profesor::pluck('id')->all();
        $categorias = Categoria::pluck('id')->all();
        $ahora = now()->format('Y-m-d H:i:s');

        DB::transaction(function () use ($profesores, $categorias, $ahora) {
            for ($i = 1; $i <= self::TOTAL_CURSOS; $i++) {
                $nombre = "Curso comparativo {$i}";
                if (DB::table('cursos')->where('nombre', $nombre)->exists()) {
                    continue;
                }
                $id = DB::table('cursos')->insertGetId([
                    'nombre' => $nombre,
                    'creditos' => ($i % 6) + 1,
                    'profesor_id' => $profesores[$i % count($profesores)],
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ]);
                DB::table('curso_categoria')->insert([
                    'curso_id' => $id,
                    'categoria_id' => $categorias[$i % count($categorias)],
                ]);
            }
        });
    }
}
