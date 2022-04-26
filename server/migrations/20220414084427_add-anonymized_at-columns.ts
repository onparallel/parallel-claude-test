import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_message", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_reminder", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("email_log", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("contact", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("file_upload", (t) => {
    t.timestamp("file_deleted_at").nullable().defaultTo(null);
  });

  await knex.raw(/* sql */ `
    -- indexes used by anonymizer cron to fetch deleted entries to anonymize
    create index "petition__deleted_at__anonymized_at" on petition (id) where deleted_at is not null and anonymized_at is null;
    create index "petition_field_reply__deleted_at__anonymized_at" on petition_field_reply (id) where deleted_at is not null and anonymized_at is null;
    create index "petition_field_comment__deleted_at__anonymized_at" on petition_field_comment (id) where deleted_at is not null and anonymized_at is null;
    create index "contact__deleted_at__anonymized_at" on contact (id) where deleted_at is not null and anonymized_at is null;
    create index "file_upload__deleted_at__file_deleted_at" on file_upload ("path") where deleted_at is not null and file_deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "petition__deleted_at__anonymized_at";
    drop index "petition_field_reply__deleted_at__anonymized_at";
    drop index "petition_field_comment__deleted_at__anonymized_at";
    drop index "contact__deleted_at__anonymized_at";
    drop index "file_upload__deleted_at__file_deleted_at";
  `);

  await knex.from("contact").whereNotNull("anonymized_at").delete();
  await knex.schema.alterTable("contact", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("file_upload", (t) => {
    t.dropColumn("file_deleted_at");
  });

  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("petition_field_reply").whereNotNull("anonymized_at").delete();
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("petition_field_comment").whereNotNull("anonymized_at").delete();
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumn("anonymized_at");
  });

  const anonymizedMessages = await knex
    .from("petition_message")
    .whereNotNull("anonymized_at")
    .select("id");

  const messageIds = anonymizedMessages.map((m) => m.id);

  // as we are going to delete anonymized petition_messages, we also have to delete petition_events referring to those messages,
  // so activity view doesn't crash for trying to fetch deleted entries
  // the same for reminders and signatures
  if (messageIds.length > 0) {
    await knex
      .from("petition_event")
      .whereIn("type", [
        "MESSAGE_SCHEDULED",
        "MESSAGE_CANCELLED",
        "MESSAGE_SENT",
        "PETITION_MESSAGE_BOUNCED",
      ])
      .whereRaw(
        /* sql */ `("data"->'petition_message_id')::int in (${messageIds
          .map(() => "?")
          .join(",")})`,
        messageIds
      )
      .delete();
    await knex.from("petition_message").whereIn("id", messageIds).delete();
  }
  await knex.schema.alterTable("petition_message", (t) => {
    t.dropColumn("anonymized_at");
  });

  const anonymizedReminders = await knex
    .from("petition_reminder")
    .whereNotNull("anonymized_at")
    .select("id");
  const reminderIds = anonymizedReminders.map((m) => m.id);

  if (reminderIds.length > 0) {
    await knex
      .from("petition_event")
      .whereIn("type", ["REMINDER_SENT", "PETITION_REMINDER_BOUNCED"])
      .whereRaw(
        /* sql */ `("data"->'petition_reminder_id')::int in (${reminderIds
          .map(() => "?")
          .join(",")})`,
        reminderIds
      )
      .delete();
    await knex.from("petition_reminder").whereIn("id", reminderIds).delete();
  }
  await knex.schema.alterTable("petition_reminder", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("email_log").whereNotNull("anonymized_at").delete();
  await knex.schema.alterTable("email_log", (t) => {
    t.dropColumn("anonymized_at");
  });

  const anonymizedSignatures = await knex
    .from("petition_signature_request")
    .whereNotNull("anonymized_at")
    .select("id");
  const signatureIds = anonymizedSignatures.map((m) => m.id);

  if (signatureIds.length > 0) {
    await knex
      .from("petition_event")
      .whereIn("type", [
        "SIGNATURE_OPENED",
        "SIGNATURE_STARTED",
        "SIGNATURE_CANCELLED",
        "SIGNATURE_COMPLETED",
        "SIGNATURE_REMINDER",
        "RECIPIENT_SIGNED",
      ])
      .whereRaw(
        /* sql */ `("data"->'petition_signature_request_id')::int in (${signatureIds
          .map(() => "?")
          .join(",")})`,
        signatureIds
      )
      .delete();
    await knex.from("petition_signature_request").whereIn("id", signatureIds).delete();
  }
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.dropColumn("anonymized_at");
  });
}
