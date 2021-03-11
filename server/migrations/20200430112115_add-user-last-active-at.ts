import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable("user", (t) => {
    t.timestamp("last_active_at");
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable("user", (t) => {
    t.dropColumn("last_active_at");
  });
}
