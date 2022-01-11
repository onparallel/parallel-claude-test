import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import SharedSignatureOutOfCreditsEmail from "../../emails/components/SharedSignatureOutOfCreditsEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function sharedSignatureOutOfCredits(
  payload: { petition_id: number },
  context: WorkerContext
) {
  const [petition, owner] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.petitions.loadPetitionOwner(payload.petition_id),
  ]);

  if (!petition) return;

  if (!owner) {
    throw new Error(`Could not find owner of Petition:${payload.petition_id}`);
  }
  const orgOwner = (await context.organizations.loadOwnerAndAdmins(petition.org_id)).find(
    (u) => u.organization_role === "OWNER"
  )!;

  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);

  const { html, text, subject, from } = await buildEmail(
    SharedSignatureOutOfCreditsEmail,
    {
      orgContactEmail: orgOwner.email,
      orgContactName: fullName(orgOwner.first_name, orgOwner.last_name),
      senderName: owner.first_name!,
      petitionName: petition.name,
      ...layoutProps,
    },
    { locale: petition.locale }
  );

  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: owner.email,
    subject,
    text,
    html,
    created_from: `Petition:${payload.petition_id}`,
  });
}
