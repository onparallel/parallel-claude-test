import { addMinutes } from "date-fns";
import Excel from "exceljs";
import safeStringify from "fast-safe-stringify";
import pMap from "p-map";
import { chunk, isDefined } from "remeda";
import { pFlatMap } from "../../util/promises/pFlatMap";
import { safeJsonParse } from "../../util/safeJsonParse";
import {
  interpolatePlaceholdersInSlate,
  renderTextWithPlaceholders,
} from "../../util/slate/placeholders";
import { RateLimitGuard } from "../helpers/RateLimitGuard";
import { TaskRunner } from "../helpers/TaskRunner";
export class BulkPetitionSendRunner extends TaskRunner<"BULK_PETITION_SEND"> {
  async run() {
    const rateLimit = new RateLimitGuard(100); // 100 petitions per second

    const { template_id: templateId, temporary_file_id: temporaryFileId } = this.task.input;

    const skipEmailSend = process.env.ENV === "staging";

    const template = await this.ctx.petitions.loadPetition(templateId);
    const user = isDefined(this.task.user_id)
      ? await this.ctx.users.loadUser(this.task.user_id)
      : null;

    if (!template || !isDefined(user)) {
      // should not happen, just in case
      return {
        status: "FAILED" as const,
        results: null,
      };
    }

    const data = await this.parseCsvFile(temporaryFileId);

    const usageLimit = await this.ctx.organizations.loadCurrentOrganizationUsageLimit(
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
              await this.ctx.orgCredits.consumePetitionSendCredits(template.org_id, 1);

              const [contact] = await this.ctx.contacts.createOrUpdate(
                {
                  org_id: template.org_id,
                  email: row.email,
                  first_name: row.firstName,
                  last_name: row.lastName ?? null,
                },
                `User:${user.id}`,
              );

              const getValues = await this.ctx.petitionMessageContext.fetchPlaceholderValues({
                petitionId: templateId,
                userId: user.id,
                contactId: contact.id,
              });

              const emailSubject = template.email_subject
                ? renderTextWithPlaceholders(template.email_subject, getValues).slice(0, 255)
                : "";

              const petition = await this.ctx.petitions.createPetitionFromId(
                templateId,
                { name: emailSubject, isTemplate: false, creditsUsed: 1 },
                user,
              );

              await this.ctx.petitions.prefillPetition(petition.id, row, user);

              const accesses = await this.ctx.petitions.createAccesses(
                petition.id,
                [
                  {
                    contact_id: contact.id,
                    reminders_left: 10,
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
              const messages = await this.ctx.petitions.createMessages(
                petition.id,
                skipEmailSend ? null : scheduledAt,
                accesses.map((access) => ({
                  petition_access_id: access.id,
                  status: skipEmailSend
                    ? "PROCESSED"
                    : isDefined(scheduledAt)
                      ? "SCHEDULED"
                      : "PROCESSING",
                  email_subject: emailSubject,
                  email_body: emailBody,
                })),
                user,
              );

              const messagesToProcess = messages.filter((m) => m.status === "PROCESSING");

              if (messagesToProcess.length > 0) {
                await this.ctx.emails.sendPetitionMessageEmail(messagesToProcess.map((m) => m.id));
                await this.ctx.petitions.createEvent(
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
              await this.onProgress(100 * (++processed / data.length));
            }
          },
          { concurrency: 1 },
        ),
      { concurrency: 1 },
    );

    return { status: "COMPLETED" as const, results };
  }

  private async validateContactData(row: Record<string, any>) {
    if (!isDefined(row.email) || !isDefined(row.firstName)) {
      throw new Error(`Missing 'email' or 'firstName' columns`);
    }

    if (!(await this.ctx.emails.validateEmail(row.email))) {
      throw new Error(`Invalid email: ${row.email}`);
    }
  }

  private async parseCsvFile(temporaryFileId: number) {
    const sendData: Record<string, any>[] = [];

    const temporaryFile = (await this.ctx.files.loadTemporaryFile(temporaryFileId))!;
    const buffer = await this.ctx.storage.temporaryFiles.downloadFile(temporaryFile.path);

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
          if (cell && cell.value !== "") {
            const match = heading.match(COMPOSED_ALIAS_REGEX);
            if (match) {
              const [, parentAlias, groupIndex, childAlias] = match;

              rowData[parentAlias] ??= [];
              rowData[parentAlias][parseInt(groupIndex)] = {
                ...rowData[parentAlias][parseInt(groupIndex)],
                [childAlias]: cell.value,
              };
            } else {
              rowData[heading] = cell.value;
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
          entry[key] = value.filter(isDefined);
        }
      }
    }

    return sendData;
  }
}
