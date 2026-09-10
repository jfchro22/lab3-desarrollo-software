<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profesor extends Model
{
    use HasFactory;

    protected $table = 'profesores';

    protected $fillable = [
        'nombre',
        'email',
        'especialidad',
    ];

    public function cursos()
    {
        return $this->hasMany(Curso::class, 'profesor_id');
    }
}