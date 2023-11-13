import { addMinutes } from "date-fns";
import Excel from "exceljs";
import safeStringify from "fast-safe-stringify";
import pMap from "p-map";
import { isDefined, sumBy, uniq } from "remeda";
import { chunkWhile } from "../../util/arrays";
import { toGlobalId } from "../../util/globalId";
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

    // chunk petitions into groups of 100 contacts
    const petitionChunks = chunkWhile(
      data,
      (currentChunk, item) =>
        currentChunk.length === 0 ||
        sumBy(currentChunk, (x) => x.contacts.length) + item.contacts.length <= 100,
    );

    const baseDate = new Date();
    let processed = 0;
    const results = await pFlatMap(
      petitionChunks,
      async (chunk, chunkIndex) =>
        await pMap(
          chunk,
          async ({ contacts, prefill, rowNumber }) => {
            try {
              await rateLimit.waitUntilAllowed();

              await this.validateContacts(contacts);
              await this.ctx.orgCredits.consumePetitionSendCredits(template.org_id, 1);

              const dbContacts = await this.ctx.contacts.createOrUpdate(
                contacts.map((contact) => ({
                  org_id: template.org_id,
                  email: contact.email!,
                  first_name: contact.firstName!,
                  last_name: contact.lastName ?? null,
                })),
                `User:${user.id}`,
              );
              const contactIds = uniq(dbContacts.map((c) => c.id));

              const getValues = await this.ctx.petitionMessageContext.fetchPlaceholderValues({
                petitionId: templateId,
                userId: user.id,
                contactId: contactIds[0],
              });

              const emailSubject = template.email_subject
                ? renderTextWithPlaceholders(template.email_subject, getValues).slice(0, 255)
                : "";

              const petition = await this.ctx.petitions.createPetitionFromId(
                templateId,
                { name: emailSubject, isTemplate: false, creditsUsed: 1 },
                user,
              );

              if (prefill) {
                await this.ctx.petitions.prefillPetition(petition.id, prefill, user);
              }

              const accesses = await this.ctx.petitions.createAccesses(
                petition.id,
                contactIds.map((contactId) => ({
                  petition_id: petition.id,
                  contact_id: contactId,
                  reminders_left: 10,
                  reminders_active: false,
                })),
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
                petition_id: toGlobalId("Petition", petition.id),
              };
            } catch (error) {
              return {
                success: false,
                petition_id: null,
                error:
                  `[row ${rowNumber}]: ` +
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

  private async validateContacts(
    contacts: { email: string | null; firstName: string | null; lastName: string | null }[],
  ) {
    if (contacts.length === 0) {
      throw new Error("Missing recipient information");
    }
    if (contacts.some((c) => !isDefined(c.email) || !isDefined(c.firstName))) {
      throw new Error("Missing recipient email or first name");
    }
    const invalidEmails: string[] = [];
    for (const { email } of contacts) {
      if (!(await this.ctx.emails.validateEmail(email!))) {
        invalidEmails.push(email!);
      }
    }

    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email(s): ${invalidEmails.join(", ")}`);
    }
  }

  private async parseCsvFile(temporaryFileId: number) {
    const sendData: {
      contacts: { email: string | null; firstName: string | null; lastName: string | null }[];
      prefill: any;
      rowNumber: number;
    }[] = [];

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
        const email = row.getCell(1).value?.toString() ?? null;
        const firstName = row.getCell(2).value?.toString() ?? null;
        const lastName = row.getCell(3).value?.toString() ?? null;
        const prefill: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          // starting from 4th column, every cell is a prefill data where the column header is the alias of the field
          if (colNumber >= 4) {
            const alias = headings[colNumber - 1];
            prefill[alias] = cell.value?.toString() ?? null;
          }
        });
        sendData.push({ contacts: [{ email, firstName, lastName }], prefill, rowNumber });
      }
    });

    return sendData;
  }
}
