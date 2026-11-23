<?php

namespace App\Providers;

use App\Repositories\CursoRepository;
use App\Repositories\EloquentCursoRepository;
use App\Repositories\EloquentMatriculaRepository;
use App\Repositories\MatriculaRepository;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CursoRepository::class, EloquentCursoRepository::class);
        $this->app->bind(MatriculaRepository::class, EloquentMatriculaRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->validarEntornoDeProduccion();
    }

    /**
     * En producción la aplicación falla de forma explícita si falta configuración obligatoria,
     * en lugar de arrancar con valores por omisión inseguros.
     */
    private function validarEntornoDeProduccion(): void
    {
        if (! $this->app->isProduction() || $this->app->runningInConsole()) {
            return;
        }

        if (blank(config('app.key'))) {
            throw new RuntimeException('Configuración ausente: defina la variable de entorno APP_KEY.');
        }

        if (config('app.url') === 'http://localhost') {
            throw new RuntimeException('Configuración ausente: defina la variable de entorno APP_URL.');
        }

        if (config('app.debug')) {
            throw new RuntimeException('APP_DEBUG debe ser false en producción.');
        }
    }
}
