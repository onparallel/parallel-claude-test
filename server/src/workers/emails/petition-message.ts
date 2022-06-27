import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionMessage from "../../emails/emails/PetitionMessage";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { toHtml, toPlainText } from "../../util/slate";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function petitionMessage(
  payload: { petition_message_id: number },
  context: WorkerContext
) {
  const message = await context.petitions.loadMessage(payload.petition_message_id);
  if (!message) {
    throw new Error(`Petition message not found for id ${payload.petition_message_id}`);
  }
  const [petition, sender, senderData, access] = await Promise.all([
    context.petitions.loadPetition(message.petition_id),
    context.users.loadUser(message.sender_id),
    context.users.loadUserDataByUserId(message.sender_id),
    context.petitions.loadAccess(message.petition_access_id),
  ]);
  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }
  if (!sender) {
    throw new Error(`User not found for petition_message.sender_id ${message.sender_id}`);
  }
  if (!senderData) {
    throw new Error(`UserData not found for User:${message.sender_id}`);
  }
  if (!access) {
    throw new Error(
      `Petition access not found for petition_message.petition_access_id ${message.petition_access_id}`
    );
  }
  const contact = await context.contacts.loadContact(access.contact_id);
  if (!contact) {
    throw new Error(`Contact not found for petition_access.contact_id ${access.contact_id}`);
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(sender.org_id, context);
  const bodyJson = message.email_body ? JSON.parse(message.email_body) : [];
  const renderContext = { contact, user: senderData, petition };

  const organization = await context.organizations.loadOrg(petition.org_id);
  const hasRemoveWhyWeUseParallel = await context.featureFlags.orgHasFeatureFlag(
    organization!.id,
    "REMOVE_WHY_WE_USE_PARALLEL"
  );
  const hasRemoveParallelBranding = await context.featureFlags.orgHasFeatureFlag(
    organization!.id,
    "REMOVE_PARALLEL_BRANDING"
  );

  const showNextButton = isDefined(petition.from_template_id)
    ? [
        "zas25KHxAByKWUeXTpW",
        "zas25KHxAByKWUgEGU6",
        "zas25KHxAByKWUgEGU9",
        "zas25KHxAByKWUgEcdC",
        "zas25KHxAByKWUgEchk",
        "zas25KHxAByKWUgEcoS",
        "zas25KHxAByKWUgEd43",
        "zas25KHxAByKWUgEcxY",
        "zas25KHxAByKWUgEcht",
        "zas25KHxAByKWUgEd44",
        "zas25KHxAByKWUhv4PT",
        "zas25KHxAByKWUb99wL",
        "zas25KHxAByKWUgGsWN",
        "zas25KHxAByKWUhv4Yb",
      ].includes(toGlobalId("Petition", petition.from_template_id))
    : false;

  const { html, text, subject, from } = await buildEmail(
    PetitionMessage,
    {
      senderName: fullName(senderData.first_name, senderData.last_name)!,
      senderEmail: senderData.email,
      subject: message.email_subject,
      bodyHtml: toHtml(bodyJson, renderContext),
      bodyPlainText: toPlainText(bodyJson, renderContext),
      deadline: petition.deadline,
      keycode: access.keycode,
      tone: organization!.preferred_tone,
      removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
      removeParallelBranding: hasRemoveParallelBranding,
      showNextButton,
      ...layoutProps,
    },
    { locale: petition.locale }
  );
  const email = await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: contact.email,
    subject,
    text,
    html,
    reply_to: senderData.email,
    track_opens: true,
    created_from: `PetitionMessage:${payload.petition_message_id}`,
  });

  await context.petitions.processPetitionMessage(payload.petition_message_id, email.id);

  return email;
}
