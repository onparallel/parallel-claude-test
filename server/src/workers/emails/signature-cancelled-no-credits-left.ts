import { WorkerContext } from "../../context";
import { PetitionSignatureConfig } from "../../db/repositories/PetitionRepository";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledNoCreditsLeftEmail from "../../emails/components/SignatureCancelledNoCreditsLeftEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function signatureCancelledNoCreditsLeft(
  payload: { petition_id: number },
  context: WorkerContext
) {
  const [petition, users, parallelOrg] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.petitions.loadUsersOnPetition(payload.petition_id),
    context.organizations.loadRootOrganization(),
  ]);

  if (!petition) return;

  const config = petition.signature_config as PetitionSignatureConfig;
  const signatureIntegration = await context.integrations.loadIntegration(config.orgIntegrationId);

  const orgOwner = (await context.organizations.loadOwnerAndAdmins(petition.org_id)).find(
    (u) => u.organization_role === "OWNER"
  )!;

  const emails = [];
  for (const user of users) {
    const isSubscribed = await context.petitions.isUserSubscribedToPetition(user.id, petition.id);
    if (!isSubscribed) {
      continue;
    }

    const { emailFrom, ...layoutProps } = await getLayoutProps(parallelOrg.id, context);

    const { html, text, subject, from } = await buildEmail(
      SignatureCancelledNoCreditsLeftEmail,
      {
        orgContactEmail: orgOwner.email,
        orgContactName: fullName(orgOwner.first_name, orgOwner.last_name),
        senderName: user.first_name!,
        petitionName: petition.name,
        signatureProvider: signatureIntegration!.name,
        ...layoutProps,
      },
      { locale: petition.locale }
    );

    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: user.email,
        subject,
        text,
        html,
        created_from: `Petition:${payload.petition_id}`,
      })
    );
  }

  return emails;
}
