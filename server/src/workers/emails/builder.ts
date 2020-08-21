import { EmailLog } from "../../db/__types";
import {
  petitionCompleted,
  commentsUserNotification,
  commentsContactNotification,
  petitionMessage,
  petitionReminder,
} from "./index";
import { WorkerContext } from "../../context";
import { MaybeArray } from "../../util/types";
import { EmailSenderWorkerPayload, EmailType, EmailPayload } from "./types";

export async function build(
  { type, payload }: EmailSenderWorkerPayload<EmailType>,
  context: WorkerContext
): Promise<MaybeArray<EmailLog> | undefined> {
  switch (type) {
    case "petition-completed":
      return await petitionCompleted(
        payload as EmailPayload["petition-completed"],
        context
      );
    case "petition-message":
      return await petitionMessage(
        payload as EmailPayload["petition-message"],
        context
      );
    case "petition-reminder":
      return await petitionReminder(
        payload as EmailPayload["petition-reminder"],
        context
      );
    case "comments-contact-notification":
      return await commentsContactNotification(
        payload as EmailPayload["comments-contact-notification"],
        context
      );
    case "comments-user-notification":
      return await commentsUserNotification(
        payload as EmailPayload["comments-user-notification"],
        context
      );
    default:
      return;
  }
}
