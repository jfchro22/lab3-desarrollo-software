<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfesorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'nombre'       => $this->nombre,
            'correo'       => $this->correo,
            'especialidad' => $this->especialidad,
        ];
    }
}