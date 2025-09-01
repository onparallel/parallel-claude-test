import { HeadObjectOutput } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { EmailLog } from "../../../db/__types";
import { PetitionClosedNotifiedEvent } from "../../../db/events/PetitionEvent";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PetitionClosedNotification from "../../../emails/emails/recipient/PetitionClosedNotification";
import { buildFrom } from "../../../emails/utils/buildFrom";
import { ILogger, LOGGER } from "../../../services/Logger";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { IPetitionBinder, PETITION_BINDER } from "../../../services/PetitionBinder";
import {
  IPetitionMessageContextService,
  PETITION_MESSAGE_CONTEXT_SERVICE,
} from "../../../services/PetitionMessageContextService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { fullName } from "../../../util/fullName";
import { sanitizeFilenameWithSuffix } from "../../../util/sanitizeFilenameWithSuffix";
import {
  renderSlateWithPlaceholdersToHtml,
  renderSlateWithPlaceholdersToText,
} from "../../../util/slate/placeholders";
import { random } from "../../../util/token";
import { withTempDir } from "../../../util/withTempDir";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionClosedNotificationEmailPayload {
  user_id: number;
  petition_id: number;
  petition_event_ids: number[];
  message: any;
  attach_pdf_export: boolean;
  pdf_export_title: string | null;
}

@injectable()
export class PetitionClosedNotificationEmailBuilder
  implements EmailBuilder<PetitionClosedNotificationEmailPayload>
{
  constructor(
    @inject(LOGGER) private logger: ILogger,
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PETITION_MESSAGE_CONTEXT_SERVICE)
    private petitionMessageContext: IPetitionMessageContextService,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(PETITION_BINDER) private petitionBinder: IPetitionBinder,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
    @inject(FileRepository) private files: FileRepository,
  ) {}

  async build(payload: PetitionClosedNotificationEmailPayload) {
    const [petition, sender, senderData] = await Promise.all([
      this.petitions.loadPetition(payload.petition_id),
      this.users.loadUser(payload.user_id),
      this.users.loadUserDataByUserId(payload.user_id),
    ]);

    if (!petition) {
      return []; // if the petition was deleted, return without throwing error
    }
    if (!sender) {
      throw new Error(`User:${payload.user_id} not found`);
    }
    if (!senderData) {
      throw new Error(`UserData not found for User:${payload.user_id}`);
    }

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(sender.org_id);

    const emails: EmailLog[] = [];

    for (const eventId of payload.petition_event_ids) {
      const event = (await this.petitions.loadPetitionEvent(
        eventId,
      )) as PetitionClosedNotifiedEvent | null;
      if (!event) {
        this.logger.error(`Expected PetitionEvent to be defined on PetitionEvent:${eventId}`);
        continue;
      }
      const access = await this.petitions.loadAccess(event.data.petition_access_id);
      const [message] = await this.petitions.loadMessagesByPetitionAccessId(access!.id);
      const granterData = await this.users.loadUserDataByUserId(access!.granter_id);
      const contact = access!.contact_id
        ? await this.contacts.loadContact(access!.contact_id)
        : null;
      if (!contact) {
        this.logger.error(`Expected Contact to be defined on PetitionAccess:${access!.id}`);
        continue;
      }

      if (!granterData) {
        this.logger.error(`Expected granter data to be defined on PetitionAccess:${access!.id}`);
        continue;
      }

      const getValues = await this.petitionMessageContext.fetchPlaceholderValues(
        {
          contactId: contact.id,
          petitionId: payload.petition_id,
          userId: payload.user_id,
          petitionAccessId: access!.id,
        },
        { publicContext: true },
      );

      const bodyHtml = renderSlateWithPlaceholdersToHtml(payload.message, getValues);

      const { html, text, subject, from } = await buildEmail(
        PetitionClosedNotification,
        {
          contactFullName: fullName(contact.first_name, contact.last_name)!,
          senderName: fullName(granterData.first_name, granterData.last_name)!,
          senderEmail: granterData.email,
          subject: message?.email_subject ?? null,
          bodyHtml,
          bodyPlainText: renderSlateWithPlaceholdersToText(payload.message, getValues),
          ...layoutProps,
        },
        { locale: petition.recipient_locale },
      );

      const email = await this.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: contact.email,
        subject,
        text,
        html,
        reply_to: senderData.email,
        track_opens: true,
        created_from: `PetitionClosedNotification:${access!.id}`,
      });

      if (payload.attach_pdf_export) {
        const latestSignature = await this.petitions.loadLatestPetitionSignatureByPetitionId(
          petition.id,
        );

        const path = random(16);

        let res: HeadObjectOutput | undefined;
        let filename: string | undefined;
        // if the parallel has a completed signature request, use that instead of the binder
        if (
          latestSignature?.status === "COMPLETED" &&
          isNonNullish(latestSignature.file_upload_id)
        ) {
          const fileUpload = await this.files.loadFileUpload(latestSignature.file_upload_id);
          assert(fileUpload, "Expected FileUpload to be defined on latest signature");
          res = await this.storage.temporaryFiles.uploadFile(
            path,
            "application/pdf",
            await this.storage.fileUploads.downloadFile(fileUpload.path),
          );
          filename = fileUpload.filename;
        } else {
          const owner = await this.petitions.loadPetitionOwner(petition.id);
          await using tempDir = await withTempDir();
          const binderPath = await this.petitionBinder.createBinder(owner!.id, {
            petitionId: petition.id,
            documentTitle: payload.pdf_export_title ?? "",
            maxOutputSize: 18 * 1024 * 1024,
            outputFileName: filename,
            outputFilePath: tempDir.path,
          });

          res = await this.storage.temporaryFiles.uploadFile(
            path,
            "application/pdf",
            createReadStream(binderPath),
          );
          filename = sanitizeFilenameWithSuffix(payload.pdf_export_title ?? "parallel", ".pdf");
        }

        const attachment = await this.files.createTemporaryFile(
          {
            path,
            content_type: "application/pdf",
            filename,
            size: res?.["ContentLength"]!.toString(),
          },
          `User:${sender.id}`,
        );

        await this.emailLogs.addEmailAttachments(email.id, attachment.id);
      }

      await this.petitions.mergePetitionEventData(event.id, {
        email_log_id: email.id,
        email_body: bodyHtml,
      });

      emails.push(email);
    }

    return emails;
  }
}
