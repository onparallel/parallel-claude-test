import { Knex } from "knex";
import { ApiContext } from "../../context";
import { Petition, User } from "../../db/__types";
import { calculateNextReminder } from "../../util/reminderUtils";
import { RESULT } from "./result";

/**
 * creates the required accesses and messages to send a petition to a group of contacts
 */
export async function presendPetition(
  petition: Petition,
  contactIds: number[],
  args: {
    remindersConfig?: any | null;
    scheduledAt?: Date | null;
    subject: string;
    body: any;
  },
  user: User,
  ctx: ApiContext,
  t?: Knex.Transaction
) {
  try {
    const accesses = await ctx.petitions.createAccesses(
      petition.id,
      contactIds.map((id) => ({
        petition_id: petition.id,
        contact_id: id,
        reminders_left: 10,
        reminders_active: Boolean(args.remindersConfig),
        reminders_config: args.remindersConfig,
        next_reminder_at: args.remindersConfig
          ? calculateNextReminder(args.scheduledAt ?? new Date(), args.remindersConfig)
          : null,
      })),
      user,
      t
    );

    const messages = await ctx.petitions.createMessages(
      petition.id,
      args.scheduledAt ?? null,
      accesses.map((access) => ({
        petition_access_id: access.id,
        status: args.scheduledAt ? "SCHEDULED" : "PROCESSING",
        email_subject: args.subject,
        email_body: JSON.stringify(args.body),
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
  } catch (error) {
    ctx.logger.error(error);
    return { result: RESULT.FAILURE, error };
  }
}
