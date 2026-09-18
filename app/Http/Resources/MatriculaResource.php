<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatriculaResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->id,
            'nota'            => $this->nota,
            'fecha_matricula' => $this->fecha_matricula?->toDateString(),
            'estudiante'      => new EstudianteResource($this->whenLoaded('estudiante')),
            'curso'           => new CursoResource($this->whenLoaded('curso')),
        ];
    }
}