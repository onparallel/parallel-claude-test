import { pick } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCompleted from "../../emails/components/PetitionCompleted";
import { buildFrom } from "../../emails/utils/buildFrom";
import { toGlobalId } from "../../util/globalId";

export async function petitionCompleted(
  payload: { petition_access_id: number },
  context: WorkerContext
) {
  const access = await context.petitions.loadAccess(payload.petition_access_id);
  if (!access) {
    throw new Error(`Access not found for id ${payload.petition_access_id}`);
  }
  const [petition, permissions, contact, fields] = await Promise.all([
    context.petitions.loadPetition(access.petition_id),
    context.petitions.loadUserPermissions(access.petition_id),
    context.contacts.loadContact(access.contact_id),
    context.petitions.loadFieldsForPetition(access.petition_id),
  ]);
  if (!petition) {
    throw new Error(
      `Petition not found for petition_access.petition_id ${access.petition_id}`
    );
  }

  if (!permissions || permissions.length === 0) {
    return;
  }
  if (!contact) {
    throw new Error(
      `Contact not found for petition_access.contact_id ${access.contact_id}`
    );
  }
  const [org, logoUrl] = await Promise.all([
    context.organizations.loadOrg(petition!.org_id),
    context.organizations.getOrgLogoUrl(petition!.org_id),
  ]);
  if (!org) {
    throw new Error(
      `Organization not found for granter.org_id ${petition!.org_id}`
    );
  }
  const subscribed = permissions.filter((p) => p && p.is_subscribed);
  for (const permission of subscribed) {
    const user = await context.users.loadUser(permission.user_id);
    const contactNameOrEmail =
      (contact.first_name && contact.last_name
        ? `${contact.first_name} ${contact.last_name}`
        : contact.first_name) || contact.email;
    const { html, text, subject, from } = await buildEmail(
      PetitionCompleted,
      {
        name: user!.first_name,
        petitionId: toGlobalId("Petition", access.petition_id),
        petitionName: petition!.name,
        contactNameOrEmail,
        fields: fields.map(pick(["id", "title", "position", "type"])),
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
        logoUrl:
          logoUrl ?? `${context.config.misc.assetsUrl}/static/emails/logo.png`,
        logoAlt: logoUrl ? org.name : "Parallel",
      },
      { locale: petition.locale }
    );
    return await context.emails.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to: user!.email,
      subject,
      text,
      html,
      created_from: `PetitionAccess:${payload.petition_access_id}`,
    });
  }
}
