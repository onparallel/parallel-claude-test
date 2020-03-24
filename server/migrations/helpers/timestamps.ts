import * as Knex from "knex";

export function timestamps(t: Knex.CreateTableBuilder) {
  const client = (t as any).client as Knex.Client;
  const now = client.raw("CURRENT_TIMESTAMP");
  t.timestamp("created_at").notNullable().defaultTo(now);
  t.string("created_by");
  t.timestamp("updated_at").notNullable().defaultTo(now);
  t.string("updated_by");
  t.timestamp("deleted_at").defaultTo(null);
  t.string("deleted_by");
}
