<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatriculaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'estudiante_id' => [
                'required',
                'integer',
                'exists:estudiantes,id',
            ],
            'curso_id' => [
                'required',
                'integer',
                'exists:cursos,id',
                Rule::unique('matriculas', 'curso_id')
                    ->where(fn ($query) => $query->where('estudiante_id', $this->input('estudiante_id'))),
            ],
            'fecha_matricula' => [
                'required',
                'date',
                'before_or_equal:today',
            ],
            'nota' => [
                'nullable',
                'numeric',
                'between:0,99.99',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'estudiante_id.required' => 'Debe indicar el estudiante a matricular.',
            'estudiante_id.exists' => 'El estudiante indicado no existe.',

            'curso_id.required' => 'Debe indicar el curso.',
            'curso_id.exists' => 'El curso indicado no existe.',
            'curso_id.unique' => 'Este estudiante ya está matriculado en este curso.',

            'fecha_matricula.required' => 'La fecha de matrícula es obligatoria.',
            'fecha_matricula.date' => 'La fecha de matrícula no tiene un formato válido.',
            'fecha_matricula.before_or_equal' => 'La fecha de matrícula no puede ser futura.',

            'nota.numeric' => 'La nota debe ser un valor numérico.',
            'nota.between' => 'La nota debe estar entre 0 y 99.99.',
        ];
    }
}