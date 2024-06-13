import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledRequestErrorEmail from "../../emails/emails/app/SignatureCancelledRequestErrorEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";

export async function signatureCancelledRequestError(
  payload: { petition_signature_request_id: number },
  context: WorkerContext,
) {
  const signatureRequest = await context.petitions.loadPetitionSignatureById(
    payload.petition_signature_request_id,
  );

  if (!signatureRequest) return;

  const petition = await context.petitions.loadPetition(signatureRequest.petition_id);
  if (!petition) return;

  const users = await context.petitions.getUsersOnPetition(petition.id);

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
      SignatureCancelledRequestErrorEmail,
      {
        petitionId: toGlobalId("Petition", petition.id),
        petitionName: petition.name,
        userName: userData.first_name,
        signers: signatureRequest.signature_config.signersInfo.map((s) => ({
          email: s.email,
          name: fullName(s.firstName, s.lastName),
        })),
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
