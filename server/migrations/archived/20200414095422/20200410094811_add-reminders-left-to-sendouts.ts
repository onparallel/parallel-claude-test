import { Knex } from "knex";
import { timestamps } from "../../helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  const columns = [
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "deleted_at",
    "deleted_by",
  ];
  return knex.schema
    .alterTable("petition_sendout", (t) => {
      columns.forEach((column) => t.renameColumn(column, `_${column}`));
    })
    .alterTable("petition_sendout", (t) => {
      t.integer("reminders_left").notNullable().defaultTo(0);
      timestamps(t);
    })
    .raw(
      /* sql */ `
      update petition_sendout as ps set
        ${columns.map((column) => `${column} = ps._${column}`).join(", ")}
    `
    )
    .alterTable("petition_sendout", (t) => {
      t.dropColumns(...columns.map((column) => `_${column}`));
    });
}

export async function down(knex: Knex): Promise<any> {}
