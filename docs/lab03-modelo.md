# Documentacion del Modelo de Datos - Laboratorio 03

**Curso:** Desarrollo de Software IV (Universidad de Costa Rica)  
**Entorno de Ejecucion:** Windows + Laragon | Motor DB: SQLite  

---

## 1. Justificacion de Entidades y Atributos

El sistema contempla 6 entidades en total (4 principales y 2 tablas pivote):

1. **profesores**: Almacena informacion del cuerpo docente (nombre, email, especialidad).
2. **cursos**: Almacena la oferta academica (nombre, codigo, creditos). Posee la clave foranea profesor_id.
3. **categorias**: Permite clasificar las asignaturas (nombre, descripcion) segun areas de conocimiento.
4. **estudiantes**: Registra los datos de los alumnos (nombre, email, carne).
5. **curso_categoria** *(Pivote N:M Simple)*: Vincula cursos con multiples categorias academicas.
6. **matriculas** *(Pivote N:M Compleja)*: Modela la relacion de inscripcion entre estudiantes y cursos, almacenando atributos adicionales del dominio:
   - nota (Decimal): Nota obtenida o en curso.
   - fecha_matricula (Date): Fecha de registro de la asignatura.

---

## 2. Decisiones de Relacion y Politicas de Borrado

* **profesores (1) -> cursos (N):**  
  - **Relacion:** Un profesor dicta muchos cursos; un curso pertenece a un profesor.
  - **Politica:** cascadeOnDelete(). Al eliminar un profesor, se eliminan en cascada sus cursos asignados para mantener la integridad referencial.

* **cursos (N) <-> categorias (M):**  
  - **Relacion:** Un curso puede pertenecer a varias categorias y viceversa.
  - **Politica:** cascadeOnDelete() en las claves foraneas de la tabla intermedia curso_categoria.

* **estudiantes (N) <-> cursos (M) (a traves de matriculas):**  
  - **Relacion:** Un estudiante matricula multiples cursos y un curso recibe multiples estudiantes.
  - **Politica:**  
    - cascadeOnDelete() en estudiante_id: Si un estudiante se elimina, sus registros de matricula se eliminan.
    - cascadeOnDelete() / restrictOnDelete() en curso_id: Configurado para proteger o limpiar el historial academico.

---

## 3. Logica de Consultas y Scopes

* **scopeConCreditosMinimos (Curso):** Permite filtrar dinamicamente el catalogo de asignaturas basandose en la carga de creditos (por defecto mayor o igual a 4).
* **Agregacion en /reportes:** Utiliza GROUP BY y funciones de agregacion (count()) sobre la tabla de matriculas para reportar la demanda estudiantil por asignatura.