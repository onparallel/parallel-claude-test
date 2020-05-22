import { buildEmail } from "../emails/buildEmail";
import PetitionReminder from "../emails/components/PetitionReminder";
import { buildFrom } from "../emails/utils/buildFrom";
import { createQueueWorker } from "./helpers/createQueueWorker";

type ReminderEmailWorkerPayload = {
  petition_reminder_id: number;
};

createQueueWorker(
  "reminder-email",
  async (payload: ReminderEmailWorkerPayload, context) => {
    const reminderId = payload.petition_reminder_id;
    const reminder = await context.reminders.loadReminder(reminderId);
    if (!reminder) {
      throw new Error(`Reminder with id ${reminderId} not found`);
    }
    if (reminder.status === "PROCESSED") {
      throw new Error(`Reminder with id ${reminderId} already processed`);
    }
    const access = await context.petitions.loadAccess(
      reminder.petition_access_id
    );
    if (!access) {
      throw new Error(
        `Petition access not found for id petition_reminder.petition_access_id ${reminder.petition_access_id}`
      );
    }
    const [petition, granter, contact, fields] = await Promise.all([
      context.petitions.loadPetition(access.petition_id),
      context.users.loadUser(access.granter_id),
      context.contacts.loadContact(access.contact_id),
      context.petitions.loadFieldsForPetition(access.petition_id),
    ]);
    if (!petition) {
      throw new Error(
        `Petition not found for petition_access.petition_id ${access.petition_id}`
      );
    }
    if (petition.status !== "PENDING") {
      throw new Error(
        `Can not sent reminder for petition ${access.petition_id} with status "${petition.status}"`
      );
    }
    if (!granter) {
      throw new Error(
        `User not found for petition_access.granter_id ${access.granter_id}`
      );
    }
    if (!contact) {
      throw new Error(
        `Contact not found for petition_access.contact_id ${access.contact_id}`
      );
    }
    const senderName = granter.last_name
      ? `${granter.first_name} ${granter.last_name}`
      : granter.first_name!;
    const { html, text, subject, from } = await buildEmail(
      PetitionReminder,
      {
        name: contact.first_name,
        senderName,
        senderEmail: granter.email,
        fields: fields.map((f) => ({ id: f.id, title: f.title })),
        deadline: petition.deadline,
        keycode: access.keycode,
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
      },
      { locale: petition.locale }
    );
    const email = await context.emails.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to: contact.email,
      subject,
      text,
      html,
      created_from: `PetitionReminder:${reminder.id}`,
    });
    await Promise.all([
      context.reminders.processReminder(reminder.id, email.id),
      context.petitions.createEvent(petition.id, "REMINDER_PROCESSED", {
        petition_reminder_id: reminder.id,
      }),
      context.aws.enqueueEmail(email.id),
    ]);
  }
);
