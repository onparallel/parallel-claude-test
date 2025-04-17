import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledNoCreditsLeftEmail from "../../emails/emails/app/SignatureCancelledNoCreditsLeftEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";

export async function signatureCancelledNoCreditsLeft(
  payload: { petition_signature_request_id: number },
  context: WorkerContext,
) {
  const [signatureRequest, parallelOrg] = await Promise.all([
    context.petitions.loadPetitionSignatureById(payload.petition_signature_request_id),
    context.organizations.loadRootOrganization(),
  ]);
  if (!signatureRequest) return;

  const petition = await context.petitions.loadPetition(signatureRequest.petition_id);
  if (!petition) return;

  const users = (await context.petitions.loadUsersOnPetition(petition.id)).filter(
    (u) => u.is_subscribed,
  );

  const signatureIntegration = await context.integrations.loadIntegration(
    signatureRequest.signature_config.orgIntegrationId,
  );

  const orgOwner = (await context.organizations.loadOrgOwner(petition.org_id))!;
  const orgOwnerData = await context.users.loadUserData(orgOwner.user_data_id);
  if (!orgOwnerData) {
    throw new Error(`UserData:${orgOwner.user_data_id} not found for User:${orgOwner.id}`);
  }

  const emails = [];
  for (const user of users) {
    const userData = await context.users.loadUserData(user.user_data_id);
    if (!userData) {
      throw new Error(`UserData:${user.user_data_id} not found for User:${user.id}`);
    }
    const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(parallelOrg.id);

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
      { locale: userData.preferred_locale },
    );

    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: userData.email,
        subject,
        text,
        html,
        created_from: `Petition:${petition.id}`,
      }),
    );
  }

  return emails;
}
