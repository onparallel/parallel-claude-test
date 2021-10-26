import { URLSearchParams } from "url";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionClosedNotification from "../../emails/components/PetitionClosedNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { toHtml, toPlainText } from "../../util/slate";
import { random } from "../../util/token";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function petitionClosedNotification(
  payload: {
    user_id: number;
    petition_id: number;
    petition_access_ids: number[];
    message: any;
    attach_pdf_export: boolean;
    pdf_export_title: string | null;
  },
  context: WorkerContext
) {
  const [petition, sender] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.users.loadUser(payload.user_id),
  ]);

  if (!petition) {
    throw new Error(`Petition with id ${payload.petition_id} not found.`);
  }
  if (!sender) {
    throw new Error(`User not found for user_id ${payload.user_id}`);
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(sender.org_id, context);

  const emails: EmailLog[] = [];
  for (const accessId of payload.petition_access_ids) {
    const access = await context.petitions.loadAccess(accessId);
    const contact = await context.contacts.loadContact(access!.contact_id);

    const renderContext = { contact, user: sender, petition };
    const { html, text, subject, from } = await buildEmail(
      PetitionClosedNotification,
      {
        contactFullName: fullName(contact!.first_name, contact!.last_name)!,
        senderName: fullName(sender.first_name, sender.last_name)!,
        senderEmail: sender.email,
        bodyHtml: toHtml(payload.message, renderContext),
        bodyPlainText: toPlainText(payload.message, renderContext),
        ...layoutProps,
      },
      { locale: petition.locale }
    );
    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: contact!.email,
      subject,
      text,
      html,
      reply_to: sender.email,
      track_opens: true,
      created_from: `PetitionClosedNotification:${accessId}`,
    });

    if (payload.attach_pdf_export) {
      const token = context.security.generateAuthToken({
        petitionId: petition.id,
        documentTitle: payload.pdf_export_title,
      });

      const buffer = await context.printer.pdf(
        `http://localhost:3000/${petition.locale}/print/petition-pdf?${new URLSearchParams({
          token,
        })}`
      );

      const path = random(16);
      await context.aws.temporaryFiles.uploadFile(path, "application/pdf", buffer);
      const attachment = await context.files.createTemporaryFile(
        {
          path,
          content_type: "application/pdf",
          filename: sanitizeFilenameWithSuffix(payload.pdf_export_title ?? "parallel", ".pdf"),
          size: buffer.byteLength.toString(),
        },
        `User:${sender.id}`
      );

      await context.emailLogs.addEmailAttachments(email.id, attachment.id);
    }

    emails.push(email);
  }

  return emails;
}
