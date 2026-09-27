<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListarMatriculaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'curso_id'      => ['sometimes', 'integer', 'exists:cursos,id'],
            'estudiante_id' => ['sometimes', 'integer', 'exists:estudiantes,id'],
            'con_nota'      => ['sometimes', 'in:si,no'],
            'sort'          => ['sometimes', 'in:fecha_matricula,nota'],
            'direction'     => ['sometimes', 'in:asc,desc'],
            'per_page'      => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'per_page.integer' => 'El parámetro per_page debe ser un número entero.',
            'per_page.min'     => 'El parámetro per_page debe ser al menos 1.',
            'per_page.max'     => 'El parámetro per_page no puede superar 50.',
        ];
    }
}