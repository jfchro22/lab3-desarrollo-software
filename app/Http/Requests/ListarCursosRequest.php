<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListarCursosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre'       => ['sometimes', 'string', 'max:150'],
            'profesor_id'  => ['sometimes', 'integer', 'exists:profesores,id'],
            'creditos_min' => ['sometimes', 'integer', 'min:1'],
            'sort'         => ['sometimes', 'in:nombre,creditos'],
            'direction'    => ['sometimes', 'in:asc,desc'],
            'per_page'     => ['sometimes', 'integer', 'min:1', 'max:50'],
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