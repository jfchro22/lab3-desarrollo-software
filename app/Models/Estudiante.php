<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Estudiante extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'email',
        'carne',
    ];

    public function cursos()
    {
        return $this->belongsToMany(Curso::class, 'matriculas')
                    ->withPivot('nota', 'fecha_matricula')
                    ->withTimestamps();
    }
}