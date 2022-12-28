import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // TODO: Hacer que referencie a un user.id con la misma org.id?
  await knex.schema.alterTable("petition", (t) => {
    t.integer("send_on_behalf_user_id").nullable().references("user.id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("send_on_behalf_user_id");
  });
}
