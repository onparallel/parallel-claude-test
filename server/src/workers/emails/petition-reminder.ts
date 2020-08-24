import { pick } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionReminder from "../../emails/components/PetitionReminder";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";

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
    const [org, logoUrl] = await Promise.all([
      context.organizations.loadOrg(granter.org_id),
      context.organizations.getOrgLogoUrl(granter.org_id),
    ]);
    if (!org) {
      throw new Error(
        `Organization not found for user.org_id ${access.contact_id}`
      );
    }
    const replies = await context.petitions.loadRepliesForField(
      fields.map((f) => f.id)
    );
    const missing = fields.filter((f, index) => replies[index]?.length === 0);
    const { html, text, subject, from } = await buildEmail(
      PetitionReminder,
      {
        name: contact.first_name,
        senderName: fullName(granter.first_name, granter.last_name)!,
        senderEmail: granter.email,
        fields: missing.map(pick(["id", "title", "position", "type"])),
        deadline: petition.deadline,
        keycode: access.keycode,
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
        logoUrl:
          logoUrl ?? `${context.config.misc.assetsUrl}/static/emails/logo.png`,
        logoAlt: logoUrl ? org.name : "Parallel",
      },
      { locale: petition.locale }
    );
    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to: contact.email,
      subject,
      text,
      html,
      reply_to: granter.email,
      created_from: `PetitionReminder:${reminder.id}`,
    });

    await context.petitions.processReminder(reminder.id, email.id);
    return email;
  } catch (error) {
    await context.petitions.reminderFailed(reminderId);
    throw error;
  }
}
