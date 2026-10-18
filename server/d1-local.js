/* Une imitation de Cloudflare D1 au-dessus de SQLite (node:sqlite), pour faire
 * tourner le serveur et ses tests sur sa machine, sans compte Cloudflare. */
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

export function localD1(file) {
  const db = new DatabaseSync(file || ":memory:");
  db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  const plain = (r) => (r ? Object.assign({}, r) : null);
  class Stmt {
    constructor(sql, args) { this.sql = sql; this.args = args || []; }
    bind(...a) { return new Stmt(this.sql, a); }
    async first() { return plain(db.prepare(this.sql).get(...this.args)); }
    async all() { return { results: db.prepare(this.sql).all(...this.args).map(plain) }; }
    async run() { const r = db.prepare(this.sql).run(...this.args); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; }
  }
  return {
    prepare: (sql) => new Stmt(sql),
    async batch(list) {
      db.exec("BEGIN");
      try { const out = []; for (const s of list) out.push(await s.run()); db.exec("COMMIT"); return out; }
      catch (e) { db.exec("ROLLBACK"); throw e; }
    },
    raw: db
  };
}
