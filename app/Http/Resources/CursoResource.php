<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CursoResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'nombre'     => $this->nombre,
            'creditos'   => $this->creditos,
            'profesor'   => new ProfesorResource($this->whenLoaded('profesor')),
            'categorias' => CategoriaResource::collection($this->whenLoaded('categorias')),
        ];
    }
}