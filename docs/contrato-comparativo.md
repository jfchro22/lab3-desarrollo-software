# Contrato Comparativo de API - Hito 0

**Proyecto:** lab3-nombreproyecto  
**Curso:** Desarrollo de Software IV (UCR)  
**Entidad Elegida:** `Curso` (`/api/cursos`)

---

## Especificacion de Endpoints Estandar

| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| **GET** | `/api/cursos` | Listar todos los cursos (con paginacion o filtros) |
| **GET** | `/api/cursos/{id}` | Obtener un curso por su ID |
| **POST** | `/api/cursos` | Crear un nuevo curso |
| **PUT** | `/api/cursos/{id}` | Actualizar un curso completo por ID |
| **PATCH** | `/api/cursos/{id}` | Actualizar parcialmente un curso por ID |
| **DELETE**| `/api/cursos/{id}` | Eliminar un curso por ID |

---

## Esquema JSON del Recurso (Curso)

```json
{
  "id": 1,
  "profesor_id": 2,
  "nombre": "Desarrollo de Software IV",
  "codigo": "IF4101",
  "creditos": 4,
  "created_at": "2026-09-10T16:53:00.000000Z",
  "updated_at": "2026-09-10T16:53:00.000000Z"
}