<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCursoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => [
                'required',
                'string',
                'min:3',
                'max:150',
                'unique:cursos,nombre',
            ],
            'creditos' => [
                'required',
                'integer',
                'between:1,6',
            ],
            'profesor_id' => [
                'required',
                'integer',
                'exists:profesores,id',
            ],
            'categoria_ids' => [
                'required',
                'array',
                'min:1',
            ],
            'categoria_ids.*' => [
                'integer',
                'exists:categorias,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del curso es obligatorio.',
            'nombre.string' => 'El nombre del curso debe ser texto.',
            'nombre.min' => 'El nombre del curso debe tener al menos 3 caracteres.',
            'nombre.max' => 'El nombre del curso no puede superar los 150 caracteres.',
            'nombre.unique' => 'Ya existe un curso con ese nombre.',

            'creditos.required' => 'Los créditos son obligatorios.',
            'creditos.integer' => 'Los créditos deben ser un número entero.',
            'creditos.between' => 'Los créditos deben estar entre 1 y 6.',

            'profesor_id.required' => 'Debe indicar el profesor que imparte el curso.',
            'profesor_id.exists' => 'El profesor indicado no existe.',

            'categoria_ids.required' => 'Debe asignar al menos una categoría al curso.',
            'categoria_ids.array' => 'Las categorías deben enviarse como una lista.',
            'categoria_ids.min' => 'Debe asignar al menos una categoría al curso.',
            'categoria_ids.*.exists' => 'Una de las categorías indicadas no existe.',
        ];
    }
}