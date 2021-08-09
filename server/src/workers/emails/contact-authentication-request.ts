import { UAParser } from "ua-parser-js";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import ContactAuthenticationRequest from "../../emails/components/ContactAuthenticationRequest";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function contactAuthenticationRequest(
  payload: { contact_authentication_request_id: number },
  context: WorkerContext
) {
  const request = await context.contacts.loadContactAuthenticationRequest(
    payload.contact_authentication_request_id
  );
  if (!request) {
    throw new Error(
      `Contact authentication request not found for id ${payload.contact_authentication_request_id}`
    );
  }
  const access = await context.petitions.loadAccess(request.petition_access_id);
  if (!access) {
    throw new Error(
      `Petition access not found for contact_authentication_request.petition_access_id ${request.petition_access_id}`
    );
  }
  const [contact, petition] = await Promise.all([
    context.contacts.loadContact(access.contact_id),
    context.petitions.loadPetition(access.petition_id),
  ]);
  if (!contact) {
    throw new Error(`Contact not found for petition_access.contact_id ${access.contact_id}`);
  }
  if (!petition) {
    throw new Error(`Petition not found for petition_access.petition_id ${access.petition_id}`);
  }
  const ua = request.user_agent ? new UAParser(request.user_agent) : null;

  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);

  const { html, text, subject, from } = await buildEmail(
    ContactAuthenticationRequest,
    {
      fullName: fullName(contact.first_name, contact.last_name),
      code: request.code,
      browserName: ua?.getBrowser()?.name ?? "Unknown",
      osName: ua?.getOS()?.name ?? "Unknown",
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
    created_from: `ContactAuthenticationRequest:${payload.contact_authentication_request_id}`,
  });

  await context.petitions.processPetitionMessage(
    payload.contact_authentication_request_id,
    email.id
  );

  return email;
}
