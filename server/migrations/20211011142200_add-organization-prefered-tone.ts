import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable("organization", (t) => {
    t.enum("prefered_tone", ["FORMAL", "INFORMAL"], {
      useNative: true,
      enumName: "org_prefered_tone",
    })
      .notNullable()
      .defaultTo("FORMAL");
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema
    .alterTable("organization", (t) => {
      t.dropColumn("prefered_tone");
    })
    .raw(/* sql */ `drop type org_prefered_tone`);
}
