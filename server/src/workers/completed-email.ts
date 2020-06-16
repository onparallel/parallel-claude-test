import { pick } from "remeda";
import { buildEmail } from "../emails/buildEmail";
import PetitionCompleted from "../emails/components/PetitionCompleted";
import { buildFrom } from "../emails/utils/buildFrom";
import { toGlobalId } from "../util/globalId";
import { createQueueWorker } from "./helpers/createQueueWorker";

type CompletedEmailWorkerPayload = { petition_access_id: number };

createQueueWorker<CompletedEmailWorkerPayload>(
  "completed-email",
  async (payload, context) => {
    const access = await context.petitions.loadAccess(
      payload.petition_access_id
    );
    if (!access) {
      throw new Error(`Access not found for id ${payload.petition_access_id}`);
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
    if (!granter) {
      throw new Error(
        `User not found for petition_access.sender_id ${access.granter_id}`
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
    const recipientNameOrEmail =
      (contact.first_name && contact.last_name
        ? `${contact.first_name} ${contact.last_name}`
        : contact.first_name!) || contact.email;
    const { html, text, subject, from } = await buildEmail(
      PetitionCompleted,
      {
        name: granter.first_name,
        petitionId: toGlobalId("Petition", access.petition_id),
        petitionName: petition!.name,
        recipientNameOrEmail,
        fields: fields.map(pick(["id", "title", "position"])),
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
        logoUrl:
          logoUrl ?? `${context.config.misc.assetsUrl}/static/emails/logo.png`,
        logoAlt: logoUrl ? org.name : "Parallel",
      },
      { locale: petition.locale }
    );
    const email = await context.emails.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to: granter.email,
      subject,
      text,
      html,
      created_from: `PetitionAccess:${payload.petition_access_id}`,
    });
    await context.aws.enqueueEmail(email.id);
  }
);
