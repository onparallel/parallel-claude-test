import { addMinutes } from "date-fns";
import Excel from "exceljs";
import safeStringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { chunk, isNonNullish, isNullish } from "remeda";
import { Config, CONFIG } from "../../../config";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { OrganizationRepository } from "../../../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { EMAILS, IEmailsService } from "../../../services/EmailsService";
import { ILogger, LOGGER } from "../../../services/Logger";
import {
  IOrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
} from "../../../services/OrganizationCreditsService";
import {
  IPetitionMessageContextService,
  PETITION_MESSAGE_CONTEXT_SERVICE,
} from "../../../services/PetitionMessageContextService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { pFlatMap } from "../../../util/promises/pFlatMap";
import { safeJsonParse } from "../../../util/safeJsonParse";
import {
  interpolatePlaceholdersInSlate,
  renderTextWithPlaceholders,
} from "../../../util/slate/placeholders";
import { RateLimitGuard } from "../../helpers/RateLimitGuard";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class BulkPetitionSendRunner extends TaskRunner<"BULK_PETITION_SEND"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(ORGANIZATION_CREDITS_SERVICE) private orgCredits: IOrganizationCreditsService,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(PETITION_MESSAGE_CONTEXT_SERVICE)
    private petitionMessageContext: IPetitionMessageContextService,
    @inject(EMAILS) private emails: IEmailsService,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"BULK_PETITION_SEND">) {
    const rateLimit = new RateLimitGuard(100); // 100 petitions per second

    const { template_id: templateId, temporary_file_id: temporaryFileId } = task.input;

    const skipEmailSend = process.env.ENV === "staging";

    const template = await this.petitions.loadPetition(templateId);
    const user = isNonNullish(task.user_id) ? await this.users.loadUser(task.user_id) : null;

    if (!template || template.deletion_scheduled_at !== null || isNullish(user)) {
      // should not happen, just in case
      return {
        status: "FAILED" as const,
        results: null,
      };
    }

    const data = await this.parseCsvFile(temporaryFileId);

    const usageLimit = await this.organizations.loadCurrentOrganizationUsageLimit(
      user.org_id,
      "PETITION_SEND",
    );

    if (!usageLimit || usageLimit.used + data.length > usageLimit.limit) {
      return {
        status: "FAILED" as const,
        error: "You don't have enough credits to send all the petitions",
        results: null,
      };
    }

    const baseDate = new Date();
    let processed = 0;
    const CHUNK_SIZE = 100;
    const results = await pFlatMap(
      // chunk into groups of 100 petitions to avoid sending every email at once
      chunk(data, CHUNK_SIZE),
      async (chunk, chunkIndex) =>
        await pMap(
          chunk,
          async (row, rowNumber) => {
            try {
              await rateLimit.waitUntilAllowed();

              await this.validateContactData(row);
              await this.orgCredits.consumePetitionSendCredits(template.org_id, 1);

              const [contact] = await this.contacts.createOrUpdate(
                {
                  org_id: template.org_id,
                  email: row.email,
                  first_name: row.firstName,
                  last_name: row.lastName ?? null,
                },
                `User:${user.id}`,
              );

              const getValues = await this.petitionMessageContext.fetchPlaceholderValues({
                petitionId: templateId,
                userId: user.id,
                contactId: contact.id,
              });

              const emailSubject = template.email_subject
                ? renderTextWithPlaceholders(template.email_subject, getValues).slice(0, 255)
                : "";

              const petition = await this.petitions.createPetitionFromId(
                templateId,
                { name: emailSubject, isTemplate: false, creditsUsed: 1 },
                user,
              );

              // if recipient is set to be signer and its not already added to the signers list on the petition, add it
              // template must have signature_config previously defined
              if (
                isNonNullish(row.recipientAsSigner) &&
                row.recipientAsSigner !== "" &&
                !!petition.signature_config?.isEnabled &&
                petition.signature_config.signersInfo.every(
                  (signer) => signer.email !== contact.email,
                )
              ) {
                await this.petitions.updatePetition(
                  petition.id,
                  {
                    signature_config: {
                      ...petition.signature_config,
                      signersInfo: petition.signature_config.signersInfo.concat({
                        email: contact.email,
                        firstName: contact.first_name,
                        lastName: contact.last_name ?? "",
                      }),
                    },
                  },
                  `User:${user.id}`,
                );
              }

              await this.petitions.prefillPetition(petition.id, row, user);

              const accesses = await this.petitions.createAccesses(
                petition.id,
                [
                  {
                    contact_id: contact.id,
                    reminders_left: 10,
                    automatic_reminders_left: 0,
                    reminders_active: false,
                  },
                ],
                user,
                false,
              );

              // first chunk is sent immediately, then add 5 minutes to scheduledAt for every other chunk
              const scheduledAt = chunkIndex === 0 ? null : addMinutes(baseDate, chunkIndex * 5);

              const emailBody = petition.email_body
                ? JSON.stringify(
                    interpolatePlaceholdersInSlate(safeJsonParse(petition.email_body), getValues),
                  )
                : "[]";

              // when skipping email send, set status to PROCESSED so it's not picked up and sent by workers
              const messages = await this.petitions.createMessages(
                petition.id,
                skipEmailSend ? null : scheduledAt,
                accesses.map((access) => ({
                  petition_access_id: access.id,
                  status: skipEmailSend
                    ? "PROCESSED"
                    : isNonNullish(scheduledAt)
                      ? "SCHEDULED"
                      : "PROCESSING",
                  email_subject: emailSubject,
                  email_body: emailBody,
                })),
                user,
              );

              const messagesToProcess = messages.filter((m) => m.status === "PROCESSING");

              if (messagesToProcess.length > 0) {
                await this.emails.sendPetitionMessageEmail(messagesToProcess.map((m) => m.id));
                await this.petitions.createEvent(
                  messagesToProcess.map((message) => ({
                    type: "MESSAGE_SENT",
                    data: { petition_message_id: message.id },
                    petition_id: message.petition_id,
                  })),
                );
              }

              return {
                success: true,
                petition_id: petition.id,
              };
            } catch (error) {
              return {
                success: false,
                petition_id: null,
                error:
                  `[row ${CHUNK_SIZE * chunkIndex + rowNumber + 1}]: ` +
                  (error instanceof Error ? error.message : safeStringify(error)),
              };
            } finally {
              await this.onProgress(task, 100 * (++processed / data.length));
            }
          },
          { concurrency: 1 },
        ),
      { concurrency: 1 },
    );

    return { status: "COMPLETED" as const, results };
  }

  private async validateContactData(row: Record<string, any>) {
    if (isNullish(row.email) || isNullish(row.firstName)) {
      throw new Error(`Missing 'email' or 'firstName' columns`);
    }

    if (!(await this.emails.validateEmail(row.email))) {
      throw new Error(`Invalid email: ${row.email}`);
    }
  }

  private async parseCsvFile(temporaryFileId: number) {
    const sendData: Record<string, any>[] = [];

    const temporaryFile = (await this.files.loadTemporaryFile(temporaryFileId))!;
    const buffer = await this.storage.temporaryFiles.downloadFile(temporaryFile.path);

    const workBook = new Excel.Workbook();
    const csvFile = await workBook.csv.read(buffer, {
      // exceljs by default tries to convert values to numbers, dates, etc.
      // we don't want that, so we just return the raw value
      // e.g. phone prefill values like "+34xxxxxxxxx" would be converted to the number 34xxxxxxxxx, which is an invalid reply for PHONE type fields
      map: (value) => value,
    });

    const headings: string[] = [];

    csvFile.workbook.worksheets[0].eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => {
          headings.push(cell.value?.toString() ?? "");
        });
      } else {
        const rowData: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          const heading = headings[colNumber - 1];
          const COMPOSED_ALIAS_REGEX = /^(.+)\[([0-9]+)\]\.(.+)$/; // e.g. "family_members[0].first_name"
          if (cell) {
            const value = cell.value?.toString().trim() ?? "";
            if (value === "") {
              return;
            }

            const match = heading.match(COMPOSED_ALIAS_REGEX);
            if (match) {
              const [, parentAlias, groupIndex, childAlias] = match;

              rowData[parentAlias] ??= [];
              rowData[parentAlias][parseInt(groupIndex)] = {
                ...rowData[parentAlias][parseInt(groupIndex)],
                [childAlias]: value,
              };
            } else {
              rowData[heading] = value;
            }
          }
        });
        sendData.push(rowData);
      }
    });

    // if any value in entry is an array, filter it to remove empty values
    // this way we will not create "empty" FIELD_GROUP replies.
    // (At least 1 child reply is required for for the parent reply to be created)
    for (const entry of sendData) {
      for (const [key, value] of Object.entries(entry)) {
        if (Array.isArray(value)) {
          entry[key] = value.filter(isNonNullish);
        }
      }
    }

    return sendData;
  }
}
