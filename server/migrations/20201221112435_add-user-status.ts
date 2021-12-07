import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable("user", (t) => {
    t.enum("status", ["ACTIVE", "INACTIVE"], {
      useNative: true,
      enumName: "user_status",
    })
      .notNullable()
      .defaultTo("ACTIVE");
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema
    .alterTable("user", (t) => {
      t.dropColumn("status");
    })
    .raw(/* sql */ `drop type user_status`);
}
