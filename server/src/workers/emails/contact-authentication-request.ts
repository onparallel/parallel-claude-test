import { UAParser } from "ua-parser-js";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import ContactAuthenticationRequest from "../../emails/emails/ContactAuthenticationRequest";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function contactAuthenticationRequest(
  payload: { contact_authentication_request_id: number; is_contact_verification: boolean },
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
    access.contact_id ? context.contacts.loadContact(access.contact_id) : null,
    context.petitions.loadPetition(access.petition_id),
  ]);

  if (!petition) {
    throw new Error(`Petition not found for petition_access.petition_id ${access.petition_id}`);
  }
  const ua = request.user_agent ? new UAParser(request.user_agent) : null;

  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);

  const { html, text, subject, from } = await buildEmail(
    ContactAuthenticationRequest,
    {
      name: contact ? contact.first_name : request.contact_first_name!,
      fullName: contact
        ? fullName(contact.first_name, contact.last_name)
        : fullName(request.contact_first_name, request.contact_last_name),
      code: request.code,
      browserName: ua?.getBrowser()?.name ?? "Unknown",
      osName: ua?.getOS()?.name ?? "Unknown",
      isContactVerification: payload.is_contact_verification,
      ...layoutProps,
    },
    { locale: petition.locale }
  );
  const email = await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: contact ? contact.email : request.contact_email!,
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
