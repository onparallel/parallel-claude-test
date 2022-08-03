import { WorkerContext } from "../../context";
import { PetitionSignatureConfig } from "../../db/repositories/PetitionRepository";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledNoCreditsLeftEmail from "../../emails/emails/SignatureCancelledNoCreditsLeftEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function signatureCancelledNoCreditsLeft(
  payload: { petition_signature_request_id: number },
  context: WorkerContext
) {
  const [signatureRequest, parallelOrg] = await Promise.all([
    context.petitions.loadPetitionSignatureById(payload.petition_signature_request_id),
    context.organizations.loadRootOrganization(),
  ]);
  if (!signatureRequest) return;

  const petition = await context.petitions.loadPetition(signatureRequest.petition_id);
  if (!petition) return;

  const users = await context.petitions.loadUsersOnPetition(petition.id);

  const config = signatureRequest.signature_config as PetitionSignatureConfig;
  const signatureIntegration = await context.integrations.loadIntegration(config.orgIntegrationId);

  const orgOwner = (await context.organizations.loadOwnerAndAdmins(petition.org_id)).find(
    (u) => u.organization_role === "OWNER"
  )!;
  const orgOwnerData = await context.users.loadUserData(orgOwner.user_data_id);
  if (!orgOwnerData) {
    throw new Error(`UserData:${orgOwner.user_data_id} not found for User:${orgOwner.id}`);
  }

  const emails = [];
  for (const user of users) {
    const isSubscribed = await context.petitions.isUserSubscribedToPetition(user.id, petition.id);
    if (!isSubscribed) {
      continue;
    }

    const userData = await context.users.loadUserData(user.user_data_id);
    if (!userData) {
      throw new Error(`UserData:${user.user_data_id} not found for User:${user.id}`);
    }
    const { emailFrom, ...layoutProps } = await getLayoutProps(parallelOrg.id, context);

    const { html, text, subject, from } = await buildEmail(
      SignatureCancelledNoCreditsLeftEmail,
      {
        orgContactEmail: orgOwnerData.email,
        orgContactName: fullName(orgOwnerData.first_name, orgOwnerData.last_name),
        senderName: userData.first_name!,
        petitionName: petition.name,
        signatureProvider: signatureIntegration!.name,
        ...layoutProps,
      },
      { locale: petition.locale }
    );

    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: userData.email,
        subject,
        text,
        html,
        created_from: `Petition:${petition.id}`,
      })
    );
  }

  return emails;
}
