<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matriculas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('estudiantes')->cascadeOnDelete();
            $table->foreignId('curso_id')->constrained('cursos')->cascadeOnDelete();
            $table->decimal('nota', 4, 2)->nullable();
            $table->date('fecha_matricula');
            $table->timestamps();
            $table->unique(['estudiante_id', 'curso_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matriculas');
    }
};