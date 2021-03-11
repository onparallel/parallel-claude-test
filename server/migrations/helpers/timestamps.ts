import { Knex } from "knex";

export function timestamps(
  t: Knex.CreateTableBuilder,
  { created = true, updated = true, deleted = true } = {}
) {
  const client = (t as any).client as Knex.Client;
  const now = client.raw("CURRENT_TIMESTAMP");
  if (created) {
    t.timestamp("created_at").notNullable().defaultTo(now);
    t.string("created_by");
  }
  if (updated) {
    t.timestamp("updated_at").notNullable().defaultTo(now);
    t.string("updated_by");
  }
  if (deleted) {
    t.timestamp("deleted_at").defaultTo(null);
    t.string("deleted_by");
  }
}
