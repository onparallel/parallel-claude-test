import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "PETITION_APPROVAL_FLOW");

  await addPetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_STARTED");
  await addPetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_APPROVED");
  await addPetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_REJECTED");
  await addPetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_SKIPPED");
  await addPetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_REMINDER");
  await addPetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_FINISHED");
  await addPetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_CANCELED");

  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("approval_flow_config").nullable();
  });

  await knex.schema.createTable("petition_approval_request_step", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.integer("step_number").notNullable();
    t.string("step_name").notNullable();
    t.enum(
      "status",
      ["NOT_STARTED", "NOT_APPLICABLE", "PENDING", "APPROVED", "REJECTED", "CANCELED", "SKIPPED"],
      {
        useNative: true,
        enumName: "petition_approval_request_step_status",
      },
    ).notNullable();
    t.enum("approval_type", ["ANY", "ALL"], {
      useNative: true,
      enumName: "petition_approval_request_step_approval_type",
    }).notNullable();
    timestamps(t, { deleted: false });
    t.timestamp("deprecated_at").nullable();
  });

  await knex.schema.createTable("petition_approval_request_step_approver", (t) => {
    t.increments("id");
    t.integer("petition_approval_request_step_id")
      .notNullable()
      .references("petition_approval_request_step.id");
    t.integer("user_id").notNullable().references("user.id");
    t.timestamp("sent_at").nullable();
    t.timestamp("approved_at").nullable();
    t.timestamp("rejected_at").nullable();
    t.timestamp("canceled_at").nullable();
    t.timestamp("skipped_at").nullable();
    timestamps(t, { deleted: false });
  });

  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.jsonb("approval_metadata").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PETITION_APPROVAL_FLOW");

  await removePetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_STARTED");
  await removePetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_APPROVED");
  await removePetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_REJECTED");
  await removePetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_SKIPPED");
  await removePetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_REMINDER");
  await removePetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_FINISHED");
  await removePetitionEvent(knex, "PETITION_APPROVAL_REQUEST_STEP_CANCELED");

  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("approval_flow_config");
  });

  await knex.schema.dropTable("petition_approval_request_step_approver");
  await knex.schema.dropTable("petition_approval_request_step");

  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumn("approval_metadata");
  });

  await knex.raw(/* sql */ `    
    drop type petition_approval_request_step_status;
    drop type petition_approval_request_step_approval_type;
  `);
}
