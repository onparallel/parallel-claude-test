import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("tag", (t) => {
      t.increments("id");
      t.integer("organization_id").notNullable().references("organization.id");
      t.string("name").notNullable();
      t.string("color").notNullable();
      timestamps(t);
    })
    .raw(
      /* sql */ `
      create unique index "tag__organization_id__name__unique" on "tag" ("organization_id", "name") where "deleted_at" is null`
    )
    .createTable("petition_tag", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable().references("petition.id");
      t.integer("tag_id").notNullable().references("tag.id");
      t.unique(
        ["petition_id", "tag_id"],
        "petition_tag__petition_id__tag_id__unique"
      );
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_tag").dropTable("tag");
}
