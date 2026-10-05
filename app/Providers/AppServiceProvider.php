<?php

namespace App\Providers;

use App\Repositories\CursoRepository;
use App\Repositories\EloquentCursoRepository;
use App\Repositories\EloquentMatriculaRepository;
use App\Repositories\MatriculaRepository;
use Illuminate\Support\ServiceProvider;

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
        //
    }
}