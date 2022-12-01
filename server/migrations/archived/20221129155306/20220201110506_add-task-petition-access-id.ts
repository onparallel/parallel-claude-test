import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.integer("user_id").nullable().alter();
    t.integer("petition_access_id").nullable().references("petition_access.id");
  }).raw(/* sql */ `
    alter table "task" add constraint "task__user_id__petition_access_id" check (
    ("user_id" is null and "petition_access_id" is not null) or ("user_id" is not null and "petition_access_id" is null))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    /* sql */ `alter table "task" drop constraint "task__user_id__petition_access_id";`
  );

  await knex.from("task").whereNull("user_id").delete();

  await knex.schema.alterTable("task", (t) => {
    t.integer("user_id").notNullable().alter();
    t.dropColumn("petition_access_id");
  });
}
