import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  }).raw(/* sql */ `
  alter table "contact" add constraint "contact__email__first_name__last_name__anonymized_at" 
  check (("email" = '' and first_name = '' and last_name = '' and "anonymized_at" is not null) or "anonymized_at" is null)
`).raw(/* sql */ `
    drop index "contact__org_id__email";

    create unique index "contact__org_id__email" 
      on "contact" ("org_id", "email")
      where "deleted_at" is null and email != ''
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    /* sql */ `alter table "contact" drop constraint "contact__email__first_name__last_name__anonymized_at"`
  );
  await knex.schema.alterTable("contact", (t) => {
    t.dropColumn("anonymized_at");
  }).raw(/* sql */ `
    drop index "contact__org_id__email";

    CREATE UNIQUE INDEX "contact__org_id__email" 
    ON "contact" ("org_id", "email")
    WHERE "deleted_at" IS NULL
   `);
}
