# Lab 04 — Capa de negocio

## Entidades trabajadas
- **Curso**: nombre, créditos, profesor (N:1), categorías (N:M).
- **Matricula**: estudiante (N:1), curso (N:1), fecha_matricula, nota.

## Reglas de negocio implementadas

| # | Regla | Dónde se valida | Excepción | Comportamiento esperado |
|---|-------|------------------|-----------|--------------------------|
| 1 | No se puede eliminar un curso con matrículas activas | `CursoService::eliminar` | `BusinessRuleException` (`curso_con_matriculas_activas`) | DELETE /api/cursos/{id} responde 422 si el curso tiene al menos una matrícula. |
| 2 | Un curso no puede exceder su cupo máximo (30 estudiantes) | `MatriculaService::crear` | `BusinessRuleException` (`cupo_maximo_alcanzado`) | POST /api/matriculas responde 422 si el curso ya tiene 30 matrículas. |
| 3 | Un estudiante no puede llevar más de 6 cursos simultáneos | `MatriculaService::crear` | `BusinessRuleException` (`limite_carga_academica`) | POST /api/matriculas responde 422 si el estudiante ya tiene 6 matrículas. |
| 4 | No se puede registrar la nota de una matrícula cuyo curso no ha iniciado | `MatriculaService::actualizarNota` | `BusinessRuleException` (`matricula_no_iniciada`) | PUT /api/matriculas/{id} responde 422 si `fecha_matricula` es futura. |

## Transacciones
`CursoService::crear` y `CursoService::actualizar` envuelven en `DB::transaction` la escritura en `cursos` + la tabla pivote `curso_categoria` (sync).

## Paginación, orden y filtros
- `GET /api/cursos?nombre=&profesor_id=&creditos_min=&sort=nombre|creditos&direction=asc|desc&per_page=` (tope 50).
- `GET /api/matriculas?curso_id=&estudiante_id=&con_nota=si|no&sort=fecha_matricula|nota&direction=asc|desc&per_page=` (tope 50).

## Pruebas
4 pruebas automatizadas en `tests/Feature/ReglasDeNegocioTest.php`, una por cada regla de negocio, todas pasando.

## Evidencia
_(Agregar capturas de Postman/Insomnia de: cada operación CRUD, cada validación fallida, cada regla violada, y la reversión de la transacción.)_