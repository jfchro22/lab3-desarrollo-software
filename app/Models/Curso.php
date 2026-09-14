<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Curso extends Model
{
    use HasFactory;

    protected $fillable = [
        'profesor_id',
        'nombre',
        'codigo',
        'creditos',
    ];

    // Scope reutilizable
    public function scopeConCreditosMinimos($query, int $creditos = 4)
    {
        return $query->where('creditos', '>=', $creditos);
    }

    public function profesor()
    {
        return $this->belongsTo(Profesor::class, 'profesor_id');
    }

    public function categorias()
    {
        return $this->belongsToMany(Categoria::class, 'curso_categoria');
    }

    public function estudiantes()
    {
        return $this->belongsToMany(Estudiante::class, 'matriculas')
                    ->withPivot('nota', 'fecha_matricula')
                    ->withTimestamps();
    }
    public function matriculas()
    {
        return $this->hasMany(Matricula::class);
    }
}