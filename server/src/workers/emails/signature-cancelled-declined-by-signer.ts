import { WorkerContext } from "../../context";
import { PetitionSignatureConfig } from "../../db/repositories/PetitionRepository";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledDeclinedBySignerEmail from "../../emails/emails/SignatureCancelledDeclinedBySignerEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function signatureCancelledDeclinedBySigner(
  payload: { petition_signature_request_id: number },
  context: WorkerContext
) {
  const signatureRequest = await context.petitions.loadPetitionSignatureById(
    payload.petition_signature_request_id
  );

  if (!signatureRequest) return;

  const petition = await context.petitions.loadPetition(signatureRequest.petition_id);
  if (!petition) return;

  const users = await context.petitions.loadUsersOnPetition(petition.id);

  const config = petition.signature_config as PetitionSignatureConfig;
  const signatureIntegration = await context.integrations.loadIntegration(config.orgIntegrationId);

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
    const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);

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
