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
    const sendout = await context.petitions.loadSendout(
      reminder.petition_sendout_id
    );
    if (!sendout) {
      throw new Error(
        `Sendout not found for id petition_reminder.petition_sendout_id ${reminder.petition_sendout_id}`
      );
    }
    const [petition, sender, contact, fields] = await Promise.all([
      context.petitions.loadPetition(sendout.petition_id),
      context.users.loadUser(sendout.sender_id),
      context.contacts.loadContact(sendout.contact_id),
      context.petitions.loadFieldsForPetition(sendout.petition_id),
    ]);
    if (!petition) {
      throw new Error(
        `Petition not found for petition_sendout.petition_id ${sendout.petition_id}`
      );
    }
    if (petition.status !== "PENDING") {
      throw new Error(
        `Can not sent reminder for petition ${sendout.petition_id} with status "${petition.status}"`
      );
    }
    if (!sender) {
      throw new Error(
        `User not found for petition_sendout.sender_id ${sendout.sender_id}`
      );
    }
    if (!contact) {
      throw new Error(
        `Contact not found for petition_sendout.contact_id ${sendout.contact_id}`
      );
    }
    const senderName = sender.last_name
      ? `${sender.first_name} ${sender.last_name}`
      : sender.first_name!;
    const { html, text, subject, from } = await buildEmail(
      PetitionReminder,
      {
        name: contact.first_name,
        senderName,
        senderEmail: sender.email,
        subject: sendout.email_subject,
        body: sendout.email_body ? JSON.parse(sendout.email_body) : [],
        fields: fields.map((f) => ({ id: f.id, title: f.title })),
        deadline: sendout.deadline,
        keycode: sendout.keycode,
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
      },
      { locale: sendout.locale }
    );
    const email = await context.emails.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to: contact.email,
      subject,
      text,
      html,
      created_from: `PetitionReminder:${reminder.id}`,
    });
    await context.reminders.updateReminder(reminder.id, {
      email_log_id: email.id,
    });
    await context.aws.enqueueEmail(email.id);
  }
);
