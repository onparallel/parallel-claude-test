import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  const columns = ["created_at", "created_by"];
  return knex.schema
    .alterTable("petition_reminder", (t) => {
      columns.forEach((column) => t.renameColumn(column, `_${column}`));
    })
    .alterTable("petition_reminder", (t) => {
      t.enum("status", ["PROCESSING", "PROCESSED"], {
        enumName: "petition_reminder_status",
        useNative: true,
      });
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
      t.string("created_by");
    })
    .raw(
      /* sql */ `
      update petition_reminder as ps set
        status = 'PROCESSED',
        ${columns.map((column) => `${column} = ps._${column}`).join(", ")}
    `
    )
    .raw(
      /* sql */ `
      alter table "petition_reminder" alter column "status" set not null;
    `
    )
    .alterTable("petition_reminder", (t) => {
      t.dropColumns(...columns.map((column) => `_${column}`));
    });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema
    .alterTable("petition_reminder", (t) => {
      t.dropColumn("status");
    })
    .raw("DROP TYPE petition_reminder_status");
}
