import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledDeclinedBySignerEmail from "../../emails/emails/app/SignatureCancelledDeclinedBySignerEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";

export async function signatureCancelledDeclinedBySigner(
  payload: { petition_signature_request_id: number },
  context: WorkerContext,
) {
  const signatureRequest = await context.petitions.loadPetitionSignatureById(
    payload.petition_signature_request_id,
  );

  if (!signatureRequest) return;

  const petition = await context.petitions.loadPetition(signatureRequest.petition_id);
  if (!petition) return;

  const users = await context.petitions.loadUsersOnPetition(petition.id);

  const signatureIntegration = await context.integrations.loadIntegration(
    signatureRequest.signature_config.orgIntegrationId,
  );

  const canceller = signatureRequest.cancel_data.canceller;
  if (!canceller || !canceller.email || !canceller.firstName) {
    throw new Error(`Expected canceller info on PetitionSignatureRequest:${signatureRequest.id}`);
  }

  const signerEmail = canceller.email as string;
  const signerName = fullName(canceller.firstName, canceller.lastName);

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
    const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(petition.org_id);

    const { html, text, subject, from } = await buildEmail(
      SignatureCancelledDeclinedBySignerEmail,
      {
        petitionId: toGlobalId("Petition", petition.id),
        petitionName: petition.name,
        userName: userData.first_name,
        signatureProvider: signatureIntegration!.name,
        signerEmail,
        signerName,
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
