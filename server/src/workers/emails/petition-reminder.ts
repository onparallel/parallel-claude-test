import { zip } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionReminder from "../../emails/components/PetitionReminder";
import { buildFrom } from "../../emails/utils/buildFrom";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { fullName } from "../../util/fullName";
import { toHtml, toPlainText } from "../../util/slate";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function petitionReminder(
  payload: { petition_reminder_id: number },
  context: WorkerContext
) {
  const reminderId = payload.petition_reminder_id;
  const reminder = await context.petitions.loadReminder(reminderId);
  if (!reminder) {
    throw new Error(`Reminder with id ${reminderId} not found`);
  }
  try {
    if (reminder.status === "PROCESSED") {
      throw new Error(`Reminder with id ${reminderId} already processed`);
    }
    const access = await context.petitions.loadAccess(reminder.petition_access_id);
    if (!access) {
      throw new Error(
        `Petition access not found for id petition_reminder.petition_access_id ${reminder.petition_access_id}`
      );
    }
    const [petition, granter, contact, fields, messages] = await Promise.all([
      context.petitions.loadPetition(access.petition_id),
      context.users.loadUser(access.granter_id),
      context.contacts.loadContact(access.contact_id),
      context.petitions.loadFieldsForPetition(access.petition_id),
      context.petitions.loadMessagesByPetitionAccessId(reminder.petition_access_id),
    ]);
    if (!petition) {
      throw new Error(`Petition not found for petition_access.petition_id ${access.petition_id}`);
    }
    if (petition.status !== "PENDING") {
      throw new Error(
        `Can not sent reminder for petition ${access.petition_id} with status "${petition.status}"`
      );
    }
    if (!granter) {
      throw new Error(`User not found for petition_access.granter_id ${access.granter_id}`);
    }
    if (!contact) {
      throw new Error(`Contact not found for petition_access.contact_id ${access.contact_id}`);
    }
    const fieldIds = fields.map((f) => f.id);
    const fieldReplies = await context.petitions.loadRepliesForField(fieldIds);
    const repliesByFieldId = Object.fromEntries(
      fieldIds.map((id, index) => [id, fieldReplies[index]])
    );
    const fieldsWithReplies = fields.map((f) => ({
      ...f,
      replies: repliesByFieldId[f.id],
    }));

    const missing = zip(fieldsWithReplies, evaluateFieldVisibility(fieldsWithReplies)).filter(
      ([field, isVisible]) => isVisible && field.type !== "HEADING" && field.replies.length === 0
    );

    const { emailFrom, ...layoutProps } = await getLayoutProps(granter.org_id, context);

    const bodyJson = reminder.email_body ? JSON.parse(reminder.email_body) : null;
    const renderContext = { contact, user: granter, petition };
    const { html, text, subject, from } = await buildEmail(
      PetitionReminder,
      {
        emailSubject: messages[0].email_subject,
        contactFullName: fullName(contact.first_name, contact.last_name)!,
        senderName: fullName(granter.first_name, granter.last_name)!,
        senderEmail: granter.email,
        missingFieldCount: missing.length,
        bodyHtml: bodyJson ? toHtml(bodyJson, renderContext) : null,
        bodyPlainText: bodyJson ? toPlainText(bodyJson, renderContext) : null,
        deadline: petition.deadline,
        keycode: access.keycode,
        ...layoutProps,
      },
      { locale: petition.locale }
    );
    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: contact.email,
      subject,
      text,
      html,
      reply_to: granter.email,
      created_from: `PetitionReminder:${reminder.id}`,
    });

    await context.petitions.processReminder(reminder.id, email.id);
    return email;
  } catch (error: any) {
    await context.petitions.reminderFailed(reminderId);
    throw error;
  }
}
