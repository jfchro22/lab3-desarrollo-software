import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Query, Res, UseGuards, ConflictException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard, SoloAdmin } from '../auth/auth.guard';
import { DbService } from '../db.service';
import { errorValidacion } from '../errores';
import { ActualizarCursoDto, CrearCursoDto, ListarCursosDto } from './dto';

@ApiTags('Cursos')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('cursos')
export class CursosController {
  constructor(private d: DbService) {}

  private ahora() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }

  private fila(c: any) { return { id: c.id, nombre: c.nombre, creditos: c.creditos, profesor_id: c.profesor_id }; }

  // [validacion:inicio]
  /** Reglas que dependen de la base (unique / exists), con el mismo formato 422. */
  private validarRefs(dto: { nombre?: string; profesor_id?: number; categoria_ids?: number[] }, ignorarId?: number) {
    const errors: Record<string, string[]> = {};
    const db = this.d.db;
    if (dto.nombre !== undefined) {
      const r = db.prepare('SELECT 1 FROM cursos WHERE nombre = ? AND id <> ?').get(dto.nombre, ignorarId ?? 0);
      if (r) errors.nombre = ['Ya existe un curso con ese nombre.'];
    }
    if (dto.profesor_id !== undefined && !db.prepare('SELECT 1 FROM profesores WHERE id = ?').get(dto.profesor_id)) {
      errors.profesor_id = ['El profesor indicado no existe.'];
    }
    if (dto.categoria_ids) {
      const ok = dto.categoria_ids.every((id) => db.prepare('SELECT 1 FROM categorias WHERE id = ?').get(id));
      if (!ok) errors.categoria_ids = ['Una de las categorías indicadas no existe.'];
    }
    if (Object.keys(errors).length) throw errorValidacion(errors);
  }
  // [validacion:fin]

  @Get()
  listar(@Query() q: ListarCursosDto) {
    const page = q.page ?? 1, perPage = q.per_page ?? 15;
    const like = q.nombre ? `%${q.nombre}%` : '%';
    const total = (this.d.db.prepare('SELECT COUNT(*) n FROM cursos WHERE nombre LIKE ?').get(like) as any).n;
    const rows = this.d.db.prepare('SELECT id,nombre,creditos,profesor_id FROM cursos WHERE nombre LIKE ? ORDER BY id LIMIT ? OFFSET ?')
      .all(like, perPage, (page - 1) * perPage);
    return { data: rows, meta: { current_page: page, per_page: perPage, total, last_page: Math.max(1, Math.ceil(total / perPage)) } };
  }

  @Get(':id')
  detalle(@Param('id', ParseIntPipe) id: number) {
    const c: any = this.d.db.prepare('SELECT id,nombre,creditos,profesor_id FROM cursos WHERE id = ?').get(id);
    if (!c) throw new NotFoundException({ message: 'Recurso no encontrado.' });
    const categorias = this.d.db.prepare('SELECT ca.id, ca.nombre FROM categorias ca JOIN curso_categoria cc ON cc.categoria_id = ca.id WHERE cc.curso_id = ?').all(id);
    return { data: { ...this.fila(c), categorias } };
  }

  @Post()
  @SoloAdmin()
  crear(@Body() dto: CrearCursoDto, @Res({ passthrough: true }) res: Response) {
    this.validarRefs(dto);
    const db = this.d.db, t = this.ahora();
    const id = db.transaction(() => {
      const r = db.prepare('INSERT INTO cursos (nombre,creditos,profesor_id,created_at,updated_at) VALUES (?,?,?,?,?)')
        .run(dto.nombre, dto.creditos, dto.profesor_id, t, t);
      const cid = Number(r.lastInsertRowid);
      for (const cat of dto.categoria_ids) db.prepare('INSERT INTO curso_categoria (curso_id,categoria_id) VALUES (?,?)').run(cid, cat);
      return cid;
    })();
    res.status(201).location(`/api/cursos/${id}`);
    return this.detalle(id);
  }

  @Put(':id') @SoloAdmin()
  actualizarPut(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarCursoDto) { return this.actualizar(id, dto); }

  @Patch(':id') @SoloAdmin()
  actualizarPatch(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarCursoDto) { return this.actualizar(id, dto); }

  private actualizar(id: number, dto: ActualizarCursoDto) {
    const db = this.d.db;
    const actual: any = db.prepare('SELECT * FROM cursos WHERE id = ?').get(id);
    if (!actual) throw new NotFoundException({ message: 'Recurso no encontrado.' });
    this.validarRefs(dto, id);
    db.transaction(() => {
      db.prepare('UPDATE cursos SET nombre=?, creditos=?, profesor_id=?, updated_at=? WHERE id=?')
        .run(dto.nombre ?? actual.nombre, dto.creditos ?? actual.creditos, dto.profesor_id ?? actual.profesor_id, this.ahora(), id);
      if (dto.categoria_ids) {
        db.prepare('DELETE FROM curso_categoria WHERE curso_id = ?').run(id);
        for (const cat of dto.categoria_ids) db.prepare('INSERT INTO curso_categoria (curso_id,categoria_id) VALUES (?,?)').run(id, cat);
      }
    })();
    return this.detalle(id);
  }

  @Delete(':id') @SoloAdmin() @HttpCode(204)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    const db = this.d.db;
    if (!db.prepare('SELECT 1 FROM cursos WHERE id = ?').get(id)) throw new NotFoundException({ message: 'Recurso no encontrado.' });
    if (db.prepare('SELECT 1 FROM matriculas WHERE curso_id = ?').get(id)) {
      throw new ConflictException({ message: 'No se puede eliminar el curso porque tiene estudiantes matriculados.', rule_code: 'curso_con_matriculas_activas' });
    }
    db.transaction(() => {
      db.prepare('DELETE FROM curso_categoria WHERE curso_id = ?').run(id);
      db.prepare('DELETE FROM cursos WHERE id = ?').run(id);
    })();
  }
}
