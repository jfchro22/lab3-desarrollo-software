<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMatriculaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nota' => [
                'required',
                'numeric',
                'between:0,99.99',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nota.required' => 'Debe indicar la nota.',
            'nota.numeric' => 'La nota debe ser un valor numérico.',
            'nota.between' => 'La nota debe estar entre 0 y 99.99.',
        ];
    }
}