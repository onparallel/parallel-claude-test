import { countBy, zip } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionReminder from "../../emails/emails/PetitionReminder";
import { buildFrom } from "../../emails/utils/buildFrom";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { fullName } from "../../util/fullName";
import { toHtml, toPlainText } from "../../util/slate";
import { getLayoutProps } from "../helpers/getLayoutProps";
import { loadOriginalMessageByPetitionAccess } from "../helpers/loadOriginalMessageByPetitionAccess";

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
    const [petition, granter, granterData, contact, fields, originalMessage] = await Promise.all([
      context.petitions.loadPetition(access.petition_id),
      context.users.loadUser(access.granter_id),
      context.users.loadUserDataByUserId(access.granter_id),
      context.contacts.loadContact(access.contact_id),
      context.petitions.loadFieldsForPetition(access.petition_id),
      loadOriginalMessageByPetitionAccess(access.id, access.petition_id, context),
    ]);
    if (!petition) {
      return; // if the petition was deleted, return without throwing error
    }
    if (petition.status !== "PENDING") {
      throw new Error(
        `Can not sent reminder for petition ${access.petition_id} with status "${petition.status}"`
      );
    }
    if (!granter) {
      throw new Error(`User not found for petition_access.granter_id ${access.granter_id}`);
    }
    if (!granterData) {
      throw new Error(`UserData not found for User:${access.granter_id}`);
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

    const repliableFields = zip(
      fieldsWithReplies,
      evaluateFieldVisibility(fieldsWithReplies)
    ).filter(([field, isVisible]) => isVisible && field.type !== "HEADING");

    const missingFieldCount = countBy(repliableFields, ([field]) => field.replies.length === 0);
    const { emailFrom, ...layoutProps } = await getLayoutProps(granter.org_id, context);

    const bodyJson = reminder.email_body ? JSON.parse(reminder.email_body) : null;
    const renderContext = { contact, user: granterData, petition };

    const organization = await context.organizations.loadOrg(petition.org_id);
    const hasRemoveWhyWeUseParallel = await context.featureFlags.orgHasFeatureFlag(
      organization!.id,
      "REMOVE_WHY_WE_USE_PARALLEL"
    );

    const { html, text, subject, from } = await buildEmail(
      PetitionReminder,
      {
        emailSubject: originalMessage?.email_subject ?? null,
        contactName: contact.first_name,
        contactFullName: fullName(contact.first_name, contact.last_name),
        senderName: fullName(granterData.first_name, granterData.last_name)!,
        senderEmail: granterData.email,
        missingFieldCount,
        totalFieldCount: repliableFields.length,
        bodyHtml: bodyJson ? toHtml(bodyJson, renderContext) : null,
        bodyPlainText: bodyJson ? toPlainText(bodyJson, renderContext) : null,
        deadline: petition.deadline,
        keycode: access.keycode,
        tone: organization!.preferred_tone,
        removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
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
      reply_to: granterData.email,
      created_from: `PetitionReminder:${reminder.id}`,
    });

    await context.petitions.processReminder(reminder.id, email.id);
    return email;
  } catch (error: any) {
    await context.petitions.reminderFailed(reminderId);
    throw error;
  }
}
