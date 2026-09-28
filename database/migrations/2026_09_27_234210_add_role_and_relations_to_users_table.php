<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'profesor', 'estudiante'])
                ->default('estudiante')
                ->after('email');

            $table->foreignId('estudiante_id')
                ->nullable()
                ->after('role')
                ->constrained('estudiantes')
                ->nullOnDelete();

            $table->foreignId('profesor_id')
                ->nullable()
                ->after('estudiante_id')
                ->constrained('profesores')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('estudiante_id');
            $table->dropConstrainedForeignId('profesor_id');
            $table->dropColumn('role');
        });
    }
};