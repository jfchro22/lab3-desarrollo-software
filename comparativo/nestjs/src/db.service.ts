import { Injectable } from '@nestjs/common';

// SQLite integrado en Node (node:sqlite, Node >= 22.13): evita módulos nativos que exigen compilar en Windows.
// Se obtiene con getBuiltinModule para que también funcione bajo Jest.
const { DatabaseSync } = (process as any).getBuiltinModule('node:sqlite');

class Db {
  constructor(private h: any) {}
  prepare(sql: string) { return this.h.prepare(sql); }
  exec(sql: string) { this.h.exec(sql); }
  close() { this.h.close(); }
  transaction<T>(fn: () => T): () => T {
    return () => {
      this.h.exec('BEGIN');
      try { const r = fn(); this.h.exec('COMMIT'); return r; }
      catch (e) { this.h.exec('ROLLBACK'); throw e; }
    };
  }
}

@Injectable()
export class DbService {
  readonly db: Db;

  constructor() {
    const h = new DatabaseSync(process.env.DB_PATH ?? '../datos/base.sqlite');
    h.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.db = new Db(h);
  }
}
