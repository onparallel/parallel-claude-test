import { isNonNullish } from "remeda";
import { PetitionEvent } from "../../db/__types";
import { removeNotDefined } from "../../util/remedaExtensions";
import { listener } from "../helpers/EventProcessor";

export const petitionActivityListener = listener(
  [
    "PETITION_CREATED",
    "ACCESS_ACTIVATED",
    "ACCESS_OPENED",
    "REPLY_CREATED",
    "REPLY_UPDATED",
    "REPLY_DELETED",
    "ACCESS_DELEGATED",
    "PETITION_COMPLETED",
    "COMMENT_PUBLISHED",
    "REPLY_STATUS_CHANGED",
    "SIGNATURE_STARTED",
    "SIGNATURE_OPENED",
    "SIGNATURE_COMPLETED",
    "SIGNATURE_CANCELLED",
    "REMINDER_SENT",
    "PETITION_CLOSED_NOTIFIED",
    "PETITION_CLOSED",
    "PETITION_REOPENED",
    "RECIPIENT_SIGNED",
    "REMINDERS_OPT_OUT",
  ],
  async (event, ctx) => {
    let lastActivityAt: Date | null = null;
    let lastRecipientActivityAt: Date | null = null;

    if (
      [
        "PETITION_CREATED",
        "ACCESS_ACTIVATED",
        "ACCESS_OPENED",
        "REPLY_CREATED",
        "REPLY_UPDATED",
        "REPLY_DELETED",
        "ACCESS_DELEGATED",
        "PETITION_COMPLETED",
        "COMMENT_PUBLISHED",
        "REPLY_STATUS_CHANGED",
        "SIGNATURE_STARTED",
        "SIGNATURE_OPENED",
        "SIGNATURE_COMPLETED",
        "SIGNATURE_CANCELLED",
        "REMINDER_SENT",
        "PETITION_CLOSED_NOTIFIED",
        "PETITION_CLOSED",
        "PETITION_REOPENED",
        "RECIPIENT_SIGNED",
        "REMINDERS_OPT_OUT",
      ].includes(event.type)
    ) {
      lastActivityAt = event.created_at;
    }

    if (
      [
        "ACCESS_OPENED",
        "ACCESS_DELEGATED",
        "SIGNATURE_OPENED",
        "SIGNATURE_COMPLETED",
        "RECIPIENT_SIGNED",
        "REMINDERS_OPT_OUT",
      ].includes(event.type)
    ) {
      lastRecipientActivityAt = event.created_at;
    }

    if (
      ["REPLY_CREATED", "REPLY_UPDATED", "REPLY_DELETED", "PETITION_COMPLETED"].includes(
        event.type,
      ) &&
      "petition_access_id" in event.data
    ) {
      lastRecipientActivityAt = event.created_at;
    }

    if (event.type === "COMMENT_PUBLISHED") {
      const comment = await ctx.petitions.loadPetitionFieldComment(
        event.data.petition_field_comment_id,
      );
      if (isNonNullish(comment?.petition_access_id)) {
        lastRecipientActivityAt = event.created_at;
      }
    }

    if (event.type === "SIGNATURE_CANCELLED" && event.data.cancel_reason === "DECLINED_BY_SIGNER") {
      lastRecipientActivityAt = event.created_at;
    }

    if (isNonNullish(lastActivityAt ?? lastRecipientActivityAt)) {
      await ctx.petitions.updatePetitionLastActivityDates(
        (event as PetitionEvent).petition_id,
        removeNotDefined({
          last_activity_at: lastActivityAt,
          last_recipient_activity_at: lastRecipientActivityAt,
        }),
      );
    }
  },
);
