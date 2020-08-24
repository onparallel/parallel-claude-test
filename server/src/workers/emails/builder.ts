import { WorkerContext } from "../../context";
import { commentsContactNotification } from "./comments-contact-notification";
import { commentsUserNotification } from "./comments-user-notification";
import { petitionCompleted } from "./petition-completed";
import { petitionMessage } from "./petition-message";
import { petitionReminder } from "./petition-reminder";

type GetPayload<F> = F extends (payload: infer P, context: WorkerContext) => any
  ? P
  : never;

export type EmailPayload = {
  "petition-completed": GetPayload<typeof petitionCompleted>;
  "comments-user-notification": GetPayload<typeof commentsUserNotification>;
  "comments-contact-notification": GetPayload<
    typeof commentsContactNotification
  >;
  "petition-message": GetPayload<typeof petitionMessage>;
  "petition-reminder": GetPayload<typeof petitionReminder>;
};

type EmailType = keyof EmailPayload;

type GenericEmailSenderWorkerPayload<T extends EmailType> = {
  type: T;
  payload: EmailPayload[T];
};

export type EmailSenderWorkerPayload = {
  [K in EmailType]: GenericEmailSenderWorkerPayload<K>;
}[EmailType];

export async function build(
  payload: EmailSenderWorkerPayload,
  context: WorkerContext
) {
  switch (payload.type) {
    case "petition-completed":
      return await petitionCompleted(payload.payload, context);
    case "petition-message":
      return await petitionMessage(payload.payload, context);
    case "petition-reminder":
      return await petitionReminder(payload.payload, context);
    case "comments-contact-notification":
      return await commentsContactNotification(payload.payload, context);
    case "comments-user-notification":
      return await commentsUserNotification(payload.payload, context);
    default:
      return;
  }
}
