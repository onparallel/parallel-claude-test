import { createReadStream } from "fs";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionClosedNotification from "../../emails/emails/PetitionClosedNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import {
  renderSlateWithPlaceholdersToHtml,
  renderSlateWithPlaceholdersToText,
} from "../../util/slate/placeholders";
import { random } from "../../util/token";

export async function petitionClosedNotification(
  payload: {
    user_id: number;
    petition_id: number;
    petition_access_ids: number[];
    message: any;
    attach_pdf_export: boolean;
    pdf_export_title: string | null;
  },
  context: WorkerContext,
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

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(sender.org_id);

  const emails: EmailLog[] = [];
  for (const accessId of payload.petition_access_ids) {
    const access = await context.petitions.loadAccess(accessId);
    const granterData = await context.users.loadUserDataByUserId(access!.granter_id);
    const contact = access!.contact_id
      ? await context.contacts.loadContact(access!.contact_id)
      : null;
    if (!contact) {
      context.logger.error(`Expected Contact to be defined on PetitionAccess:${access!.id}`);
      continue;
    }

    if (!granterData) {
      context.logger.error(`Expected granter data to be defined on PetitionAccess:${access!.id}`);
      continue;
    }

    const getValues = await context.petitionMessageContext.fetchPlaceholderValues(
      {
        contactId: contact.id,
        petitionId: payload.petition_id,
        userId: payload.user_id,
        petitionAccessId: accessId,
      },
      { publicContext: true },
    );

    const { html, text, subject, from } = await buildEmail(
      PetitionClosedNotification,
      {
        contactFullName: fullName(contact.first_name, contact.last_name)!,
        senderName: fullName(granterData.first_name, granterData.last_name)!,
        senderEmail: granterData.email,
        bodyHtml: renderSlateWithPlaceholdersToHtml(payload.message, getValues),
        bodyPlainText: renderSlateWithPlaceholdersToText(payload.message, getValues),
        ...layoutProps,
      },
      { locale: petition.recipient_locale },
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
      const filename = sanitizeFilenameWithSuffix(payload.pdf_export_title ?? "parallel", ".pdf");
      const owner = await context.petitions.loadPetitionOwner(petition.id);
      const binderPath = await context.petitionBinder.createBinder(owner!.id, {
        petitionId: petition.id,
        documentTitle: payload.pdf_export_title ?? "",
        maxOutputSize: 18 * 1024 * 1024,
        outputFileName: filename,
      });
      const path = random(16);

      const res = await context.storage.temporaryFiles.uploadFile(
        path,
        "application/pdf",
        createReadStream(binderPath),
      );
      const attachment = await context.files.createTemporaryFile(
        {
          path,
          content_type: "application/pdf",
          filename,
          size: res["ContentLength"]!.toString(),
        },
        `User:${sender.id}`,
      );

      await context.emailLogs.addEmailAttachments(email.id, attachment.id);
    }

    emails.push(email);
  }

  return emails;
}
