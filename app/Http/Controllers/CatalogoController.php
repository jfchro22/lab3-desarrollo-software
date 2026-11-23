<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoriaResource;
use App\Http\Resources\ProfesorResource;
use App\Models\Categoria;
use App\Models\Profesor;

/**
 * @tags Catálogos
 */
class CatalogoController extends Controller
{
    /**
     * Listar profesores
     *
     * Devuelve todos los profesores ordenados por nombre, para llenar listas de selección en los clientes.
     */
    public function profesores()
    {
        return ProfesorResource::collection(Profesor::query()->orderBy('nombre')->get());
    }

    /**
     * Listar categorías
     *
     * Devuelve todas las categorías ordenadas por nombre, para llenar listas de selección en los clientes.
     */
    public function categorias()
    {
        return CategoriaResource::collection(Categoria::query()->orderBy('nombre')->get());
    }
}
