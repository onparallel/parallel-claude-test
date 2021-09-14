import { useMemo } from "react";
import { useIntl } from "react-intl";

export type ReminderOptOutReason =
  | "NOT_INTERESTED"
  | "NOT_REQUESTED"
  | "WRONG_PERSON"
  | "NO_REMINDERS"
  | "OTHER";

export function useReminderOptOutReasons(): Record<ReminderOptOutReason, string> {
  const intl = useIntl();

  return useMemo(
    () => ({
      NOT_INTERESTED: intl.formatMessage({
        id: "public.opt-out.answer-not-interested",
        defaultMessage: "I am not interested in this service anymore",
      }),
      NOT_REQUESTED: intl.formatMessage({
        id: "public.opt-out.answer-not-requested",
        defaultMessage: "I have not requested this service",
      }),
      WRONG_PERSON: intl.formatMessage({
        id: "public.opt-out.answer-wrong-person",
        defaultMessage: "I am not the person to complete this information",
      }),
      NO_REMINDERS: intl.formatMessage({
        id: "public.opt-out.answer-no-reminders",
        defaultMessage:
          "I will upload the information but I do not want to receive any more emails",
      }),
      SPAM: intl.formatMessage({
        id: "public.opt-out.answer-spam",
        defaultMessage: "I consider this is spam",
      }),
      OTHER: intl.formatMessage({
        id: "public.opt-out.answer-other",
        defaultMessage: "Other",
      }),
    }),
    [intl.locale]
  );
}
