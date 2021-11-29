import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.integer("restricted_by_user_id").nullable();
    t.timestamp("restricted_at").nullable();
    t.string("restricted_password").nullable();
  });

  await knex.raw(/* sql */ `
    update "petition" p
    set
      restricted_at = NOW(),
      restricted_by_user_id = split_part(p.created_by, ':', 2)::int
    where is_readonly = true;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex("petition").whereNotNull("restricted_by_user_id").update({ is_readonly: true });

  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("restricted_by_user_id");
    t.dropColumn("restricted_at");
    t.dropColumn("restricted_password");
  });
}
