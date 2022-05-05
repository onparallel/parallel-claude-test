import { Readable } from "stream";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionClosedNotification from "../../emails/emails/PetitionClosedNotification";
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
  const [petition, sender, senderData] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.users.loadUser(payload.user_id),
    context.users.loadUserDataByUserId(payload.user_id),
  ]);

  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }
  if (!sender) {
    throw new Error(`User:${payload.user_id} not found`);
  }
  if (!senderData) {
    throw new Error(`UserData not found for User:${payload.user_id}`);
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(sender.org_id, context);

  const emails: EmailLog[] = [];
  for (const accessId of payload.petition_access_ids) {
    const access = await context.petitions.loadAccess(accessId);
    const contact = await context.contacts.loadContact(access!.contact_id);
    if (!contact) {
      continue;
    }

    const hasRemoveParallelBranding = await context.featureFlags.orgHasFeatureFlag(
      petition.org_id,
      "REMOVE_PARALLEL_BRANDING"
    );

    const renderContext = { contact, user: senderData, petition };
    const { html, text, subject, from } = await buildEmail(
      PetitionClosedNotification,
      {
        contactFullName: fullName(contact.first_name, contact.last_name)!,
        senderName: fullName(senderData.first_name, senderData.last_name)!,
        senderEmail: senderData.email,
        bodyHtml: toHtml(payload.message, renderContext),
        bodyPlainText: toPlainText(payload.message, renderContext),
        removeParallelBranding: hasRemoveParallelBranding,
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
      created_from: `PetitionClosedNotification:${accessId}`,
    });

    if (payload.attach_pdf_export) {
      const owner = await context.petitions.loadPetitionOwner(petition.id);
      const documentStream = await context.printer.petitionExport(owner!.id, {
        petitionId: petition.id,
        documentTitle: payload.pdf_export_title ?? "",
      });
      const path = random(16);

      const readable = new Readable();
      readable.wrap(documentStream);
      const res = await context.aws.temporaryFiles.uploadFile(path, "application/pdf", readable);
      const attachment = await context.files.createTemporaryFile(
        {
          path,
          content_type: "application/pdf",
          filename: sanitizeFilenameWithSuffix(payload.pdf_export_title ?? "parallel", ".pdf"),
          size: res["ContentLength"]!.toString(),
        },
        `User:${sender.id}`
      );

      await context.emailLogs.addEmailAttachments(email.id, attachment.id);
    }

    emails.push(email);
  }

  return emails;
}
