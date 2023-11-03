import { addMinutes } from "date-fns";
import safeStringify from "fast-safe-stringify";
import pMap from "p-map";
import { isDefined, isNumber, partition, sumBy, uniq } from "remeda";
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

    const { template_id: templateId, data } = this.task.input;

    const skipEmailSend = process.env.ENV === "staging";

    if (data.length === 0) {
      return { results: [] };
    }

    if (!isDefined(this.task.user_id)) {
      throw new Error(`Expected user_id to be defined for Task:${this.task.id}`);
    }
    const user = await this.ctx.users.loadUser(this.task.user_id);
    if (!isDefined(user)) {
      throw new Error(`User:${this.task.user_id} not found on Task:${this.task.id}`);
    }

    const template = (await this.ctx.petitions.loadPetition(templateId))!;

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
          async ({ contacts, prefill }) => {
            try {
              await rateLimit.waitUntilAllowed();

              await this.ctx.orgCredits.consumePetitionSendCredits(template.org_id, 1);

              const [_contactIds, contactsData] = partition(contacts, isNumber);
              const _contacts = await this.ctx.contacts.createOrUpdate(
                contactsData.map((contact) => ({
                  org_id: template.org_id,
                  email: contact.email,
                  first_name: contact.first_name,
                  last_name: contact.last_name,
                })),
                `User:${user.id}`,
              );
              const contactIds = uniq([..._contactIds, ..._contacts.map((c) => c.id)]);

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
                error: error instanceof Error ? error.message : safeStringify(error),
              };
            } finally {
              await this.onProgress(100 * (++processed / data.length));
            }
          },
          { concurrency: 1 },
        ),
      { concurrency: 1 },
    );

    return { results };
  }
}
