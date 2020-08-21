type PetitionCompletedEmailPayload = { petition_access_id: number };

type CommentsContactNotificationEmailPayload = {
  petition_id: number;
  user_id: number;
  petition_access_ids: number[];
  petition_field_comment_ids: number[];
};

type CommentsUserNotificationEmailPayload = {
  petition_id: number;
  petition_access_id: number;
  user_ids: number[];
  petition_field_comment_ids: number[];
};

type PetitionMessageEmailPayload = { petition_message_id: number };

type PetitionReminderEmailPayload = { petition_reminder_id: number };

export type EmailPayload = {
  "petition-completed": PetitionCompletedEmailPayload;
  "comments-user-notification": CommentsUserNotificationEmailPayload;
  "comments-contact-notification": CommentsContactNotificationEmailPayload;
  "petition-message": PetitionMessageEmailPayload;
  "petition-reminder": PetitionReminderEmailPayload;
};

export type EmailType = keyof EmailPayload;

export type EmailSenderWorkerPayload<T extends EmailType> = {
  type: T;
  payload: EmailPayload[T];
};
