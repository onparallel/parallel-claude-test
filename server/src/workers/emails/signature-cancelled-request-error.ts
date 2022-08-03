import { WorkerContext } from "../../context";
import { PetitionSignatureConfig } from "../../db/repositories/PetitionRepository";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledRequestErrorEmail from "../../emails/emails/SignatureCancelledRequestErrorEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function signatureCancelledRequestError(
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

  const config = signatureRequest.signature_config as PetitionSignatureConfig;

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
      SignatureCancelledRequestErrorEmail,
      {
        petitionId: toGlobalId("Petition", petition.id),
        petitionName: petition.name,
        userName: userData.first_name,
        signers: config.signersInfo.map((s) => ({
          email: s.email,
          name: fullName(s.firstName, s.lastName),
        })),
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
