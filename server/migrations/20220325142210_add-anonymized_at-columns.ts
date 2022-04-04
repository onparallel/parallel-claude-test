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
}

export async function down(knex: Knex): Promise<void> {
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
