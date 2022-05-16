import { addMinutes } from "date-fns";
import { Knex } from "knex";
import pMap from "p-map";
import { ApiContext } from "../../context";
import { Petition, PetitionMessage, User } from "../../db/__types";
import { chunkWhile, sumBy } from "../../util/arrays";
import { calculateNextReminder, PetitionAccessReminderConfig } from "../../util/reminderUtils";
import { RESULT } from "./result";

/**
 * creates the required accesses and messages to send a petition to a group of contacts
 */
export async function presendPetition(
  petitionSendGroups: [Pick<Petition, "id" | "name">, number[]][],
  args: {
    remindersConfig?: PetitionAccessReminderConfig | null;
    scheduledAt?: Date | null;
    subject: string;
    body: any;
  },
  user: User,
  userDelegate: User | null,
  fromPublicPetitionLink: boolean,
  ctx: ApiContext,
  // use a fixed base date to avoid small time increments on each send time caused by the execution of the code
  baseDate = new Date(),
  t?: Knex.Transaction
) {
  // partition the recipient emails into CHUNK_SIZE chunks and defer the emails by 5 minutes each chunk.
  // this helps us distribute massive sends in time and avoid getting flagged as spam.
  const CHUNK_SIZE = 20;
  return ctx.petitions.withTransaction(async (t) => {
    return (
      await pMap(
        chunkWhile(
          petitionSendGroups,
          (chunk, [_, current]) =>
            // current chunk is empty, or
            chunk.length === 0 ||
            // (number of contactIds in the accumulated chunk) + (number of contactIds in the current sendGroup) <= CHUNK_SIZE
            sumBy(chunk, ([_, curr]) => curr.length) + current.length <= CHUNK_SIZE
        ),
        async (currentChunk, index) => {
          return await pMap(
            currentChunk,
            async ([petition, contactIds]) => {
              try {
                const scheduledAt =
                  index === 0
                    ? args.scheduledAt
                    : addMinutes(args.scheduledAt ?? baseDate, index * 5);
                const accesses = await ctx.petitions.createAccesses(
                  petition.id,
                  contactIds.map((contactId) => ({
                    petition_id: petition.id,
                    contact_id: contactId,
                    delegate_granter_id: userDelegate ? user.id : null,
                    reminders_left: 10,
                    reminders_active: Boolean(args.remindersConfig),
                    reminders_config: args.remindersConfig,
                    next_reminder_at: args.remindersConfig
                      ? calculateNextReminder(scheduledAt ?? baseDate, args.remindersConfig)
                      : null,
                  })),
                  userDelegate ? userDelegate : user,
                  fromPublicPetitionLink,
                  t
                );
                const messages = await ctx.petitions.createMessages(
                  petition.id,
                  scheduledAt ?? null,
                  accesses.map((access) => ({
                    petition_access_id: access.id,
                    status: scheduledAt ? "SCHEDULED" : "PROCESSING",
                    email_subject: args.subject,
                    email_body: JSON.stringify(args.body ?? []),
                  })),
                  userDelegate ? userDelegate : user,
                  t
                );
                const [updatedPetition] = await ctx.petitions.updatePetition(
                  petition.id,
                  { name: petition.name ?? args.subject, status: "PENDING", credits_used: 1 },
                  `User:${user.id}`,
                  t
                );
                return {
                  petition: updatedPetition,
                  accesses,
                  messages,
                  result: RESULT.SUCCESS,
                };
              } catch (error: any) {
                ctx.logger.error(error.message, { stack: error.stack });
                return { result: RESULT.FAILURE, error };
              }
            },
            { concurrency: 5 }
          );
        },
        { concurrency: 1 } // keep concurrency at 1 so the schedule time for massive sends can be properly calculated
      )
    ).flat();
  }, t);
}

export async function sendPetitionMessageEmails(messages: PetitionMessage[], ctx: ApiContext) {
  if (messages.length > 0) {
    await Promise.all([
      ctx.emails.sendPetitionMessageEmail(messages.map((m) => m.id)),
      ctx.petitions.createEvent(
        messages.map((message) => ({
          type: "MESSAGE_SENT",
          data: { petition_message_id: message.id },
          petition_id: message.petition_id,
        }))
      ),
    ]);
  }
}
