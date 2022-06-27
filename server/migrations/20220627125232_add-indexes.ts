import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- useful for loadPublicTemplates and getPetitionStatsByFromTemplateId subqueries
    create index "petition__from_template_id" on "petition" ("from_template_id") where deleted_at is null;

    -- useful for getPetitionStatsByFromTemplateId subquery
    create index "petition_field__petition_id" on "petition_field" ("petition_id") where deleted_at is null;
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "petition__from_template_id";
    drop index "petition_field__petition_id";
`);
}
