import { addMinutes } from "date-fns";
import { Knex } from "knex";
import pMap from "p-map";
import { chunk } from "remeda";
import { ApiContext } from "../../context";
import { Petition, PetitionMessage, User } from "../../db/__types";
import { calculateNextReminder } from "../../util/reminderUtils";
import { RESULT } from "./result";

/**
 * creates the required accesses and messages to send a petition to a group of contacts
 */
export async function presendPetition(
  petitionSendGroups: [Petition, number[]][],
  args: {
    remindersConfig?: any | null;
    scheduledAt?: Date | null;
    subject: string;
    body: any;
  },
  user: User,
  fromPublicPetitionLink: boolean,
  ctx: ApiContext,
  t?: Knex.Transaction
) {
  // partition the recipient emails into CHUNK_SIZE chunks and defer the emails by 5 minutes each chunk.
  // this helps us distribute massive sends in time and avoid getting flagged as spam.
  const CHUNK_SIZE = 20;
  return await pMap(
    chunk(petitionSendGroups, CHUNK_SIZE),
    async (currentChunk, index) => {
      return await pMap(
        currentChunk,
        async ([petition, contactIds]) => {
          try {
            const scheduledAt =
              index === 0
                ? args.scheduledAt
                : addMinutes(args.scheduledAt ?? new Date(), index * 5);
            const accesses = await ctx.petitions.createAccesses(
              petition.id,
              contactIds.map((contactId) => ({
                petition_id: petition.id,
                contact_id: contactId,
                reminders_left: 10,
                reminders_active: Boolean(args.remindersConfig),
                next_reminder_at: args.remindersConfig
                  ? calculateNextReminder(scheduledAt ?? new Date(), args.remindersConfig)
                  : null,
              })),
              user,
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
              user,
              t
            );
            const [updatedPetition] = await ctx.petitions.updatePetition(
              petition.id,
              { name: petition.name ?? args.subject, status: "PENDING" },
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
  );
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
