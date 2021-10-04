import { addMinutes } from "date-fns";
import { Knex } from "knex";
import pMap from "p-map";
import { chunk } from "remeda";
import { ApiContext } from "../../context";
import { Petition, PetitionAccess, PetitionMessage, User } from "../../db/__types";
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
  // partition the recipient emails into CHUNK_SIZE chunks and defer the emails by 5 minutes each chunk, adding up to 30 minutes.
  // this helps us distribute massive sends in time and avoid getting flagged as spam.
  const CHUNK_SIZE = 20;
  let totalPetitionMessagesSent = 0;
  return await pMap(
    petitionSendGroups,
    async ([petition, contactIds]) => {
      try {
        const contactIdChunks = chunk(contactIds, CHUNK_SIZE);
        const accesses: PetitionAccess[] = [];
        const messages: PetitionMessage[] = [];

        for (let chunkIndex = 0; chunkIndex < contactIdChunks.length; chunkIndex++) {
          const contactIdsBatch = contactIdChunks[chunkIndex];
          // for each CHUNK_SIZE messages sent, add 5 minutes to the send time up to 30 minutes, where it starts again on 0.
          // with a scheduleGroupIndex in range [0, 6] we can add up to 30 minutes to the scheduled send time
          const scheduleGroupIndex = Math.floor(totalPetitionMessagesSent / CHUNK_SIZE) % 7;
          const scheduledAt =
            scheduleGroupIndex === 0
              ? args.scheduledAt
              : addMinutes(args.scheduledAt ?? new Date(), scheduleGroupIndex * 5);

          const newAccesses = await ctx.petitions.createAccesses(
            petition.id,
            contactIdsBatch.map((contactId) => ({
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

          const newMessages = await ctx.petitions.createMessages(
            petition.id,
            scheduledAt ?? null,
            newAccesses.map((access) => ({
              petition_access_id: access.id,
              status: scheduledAt ? "SCHEDULED" : "PROCESSING",
              email_subject: args.subject,
              email_body: JSON.stringify(args.body ?? []),
            })),
            user,
            t
          );

          accesses.push(...newAccesses);
          messages.push(...newMessages);
          totalPetitionMessagesSent += newMessages.length;
        }

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
