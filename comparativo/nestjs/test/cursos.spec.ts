import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
const { DatabaseSync } = (process as any).getBuiltinModule('node:sqlite');
import { tmpdir } from 'os';
import { join } from 'path';
import { unlinkSync } from 'fs';

const dbPath = join(tmpdir(), `nest-test-${process.pid}.sqlite`);
process.env.DB_PATH = dbPath;

let app: INestApplication;

beforeAll(async () => {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT, role TEXT);
    CREATE TABLE profesores (id INTEGER PRIMARY KEY, nombre TEXT);
    CREATE TABLE categorias (id INTEGER PRIMARY KEY, nombre TEXT);
    CREATE TABLE cursos (id INTEGER PRIMARY KEY, nombre TEXT, creditos INTEGER, profesor_id INTEGER, created_at TEXT, updated_at TEXT);
    CREATE TABLE curso_categoria (curso_id INTEGER, categoria_id INTEGER);
    CREATE TABLE matriculas (id INTEGER PRIMARY KEY, estudiante_id INTEGER, curso_id INTEGER);
    INSERT INTO profesores VALUES (1,'Profe Uno'); INSERT INTO categorias VALUES (1,'Informática');`);
  db.prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)').run('Admin', 'admin@test.com', bcrypt.hashSync('Clave1234', 10).replace('$2a$', '$2y$'), 'admin');
  db.close();
  const { AppModule } = await import('../src/app.module');
  const { configurar } = await import('../src/app.setup');
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = mod.createNestApplication();
  configurar(app);
  await app.init();
});

afterAll(async () => { await app.close(); try { unlinkSync(dbPath); } catch {} });

const login = async () =>
  (await request(app.getHttpServer()).post('/api/login').send({ email: 'admin@test.com', password: 'Clave1234' })).body.token;

describe('Contrato común - Curso', () => {
  it('1) login: 200 con token, 401 con credenciales incorrectas, 422 con datos inválidos', async () => {
    const http = request(app.getHttpServer());
    const ok = await http.post('/api/login').send({ email: 'admin@test.com', password: 'Clave1234' }).expect(200);
    expect(ok.body).toHaveProperty('token');
    expect(ok.body.usuario).toMatchObject({ email: 'admin@test.com', role: 'admin' });
    await http.post('/api/login').send({ email: 'admin@test.com', password: 'mala' }).expect(401);
    await http.post('/api/login').send({ email: 'no-es-correo' }).expect(422);
  });

  it('2) listado: 401 sin token y 200 paginado con token', async () => {
    const http = request(app.getHttpServer());
    await http.get('/api/cursos').expect(401);
    const token = await login();
    const r = await http.get('/api/cursos?page=1&per_page=10').set('Authorization', `Bearer ${token}`).expect(200);
    expect(r.body).toHaveProperty('data');
    expect(r.body.meta).toMatchObject({ current_page: 1, per_page: 10 });
  });

  it('3) creación: 422 con datos inválidos, 201 con Location, y 404 al consultar uno inexistente', async () => {
    const http = request(app.getHttpServer());
    const token = await login();
    const bad = await http.post('/api/cursos').set('Authorization', `Bearer ${token}`).send({ nombre: 'x', creditos: 9 }).expect(422);
    expect(bad.body.errors).toHaveProperty('nombre');
    expect(bad.body.errors).toHaveProperty('creditos');
    const ok = await http.post('/api/cursos').set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Curso de prueba', creditos: 3, profesor_id: 1, categoria_ids: [1] }).expect(201);
    expect(ok.headers.location).toMatch(/\/api\/cursos\/\d+$/);
    await http.get('/api/cursos/99999').set('Authorization', `Bearer ${token}`).expect(404);
    await http.delete(`/api/cursos/${ok.body.data.id}`).set('Authorization', `Bearer ${token}`).expect(204);
  });
});
