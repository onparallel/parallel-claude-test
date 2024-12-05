import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_list_view", (t) => {
    t.dropColumn("type");
  });

  await knex.raw(/* sql */ `
    drop type petition_list_view_type;
  `);

  await knex.schema.alterTable("profile", (t) => {
    t.string("name").nullable().alter(); // mark as nullable to be dropped later
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_list_view", (t) => {
    t.enum("type", ["ALL", "CUSTOM"], { useNative: true, enumName: "petition_list_view_type" })
      .nullable()
      .defaultTo("CUSTOM");
  });

  await knex.raw(/* sql */ `
    comment on column petition_list_view.type is '@deprecated'; 
  `);

  await knex.schema.alterTable("profile", (t) => {
    t.string("name").notNullable().alter();
  });
}
