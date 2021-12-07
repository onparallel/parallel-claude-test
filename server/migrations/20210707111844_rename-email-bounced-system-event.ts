import { Knex } from "knex";
import { addSystemEvent, removeSystemEvent } from "./helpers/systemEvents";

export async function up(knex: Knex): Promise<void> {
  await addSystemEvent(knex, "PETITION_MESSAGE_BOUNCED");

  const events = await knex
    .from("system_event")
    .where({ type: "EMAIL_BOUNCED" })
    .update({ type: "PETITION_MESSAGE_BOUNCED" }, "*");

  await removeSystemEvent(knex, "EMAIL_BOUNCED");

  // modify "data" column of PETITION_MESSAGE_BOUNCED event to contain the petition_message_id instead of the email_log_id
  for (const event of events) {
    const [message] = await knex
      .from("petition_message")
      .where({ email_log_id: event.data.email_log_id })
      .select("*");
    if (!message) {
      // bounce from reminder
      await knex.from("system_event").where({ id: event.id }).delete();
    } else {
      await knex
        .from("system_event")
        .where({ id: event.id })
        .update({ data: { petition_message_id: message.id } });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await addSystemEvent(knex, "EMAIL_BOUNCED");

  const events = await knex
    .from("system_event")
    .where({ type: "PETITION_MESSAGE_BOUNCED" })
    .update({ type: "EMAIL_BOUNCED" }, "*");

  await removeSystemEvent(knex, "PETITION_MESSAGE_BOUNCED");

  for (const event of events) {
    const [message] = await knex
      .from("petition_message")
      .where({ id: event.data.petition_message_id })
      .select("*");

    await knex
      .from("system_event")
      .where({ id: event.id })
      .update({ data: { email_log_id: message.email_log_id } });
  }
}

export const config = {
  transaction: false,
};
