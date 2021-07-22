import { useMemo } from "react";
import { useIntl } from "react-intl";

export type UnsubscribeAnswersKey =
  | "NOT_INTERESTED"
  | "NOT_REQUESTED"
  | "WRONG_PERSON"
  | "NO_REMINDERS"
  | "OTHER";

export type UnsubscribeAnswersType = {
  [key in UnsubscribeAnswersKey]: string;
};

export function useUnsubscribeAnswers(): UnsubscribeAnswersType {
  const intl = useIntl();

  return useMemo(
    () => ({
      NOT_INTERESTED: intl.formatMessage({
        id: "public.unsubscribe.answer-not-interested",
        defaultMessage: "I am not interested in this service anymore",
      }),
      NOT_REQUESTED: intl.formatMessage({
        id: "public.unsubscribe.answer-not-requested",
        defaultMessage: "I have not requested this service",
      }),
      WRONG_PERSON: intl.formatMessage({
        id: "public.unsubscribe.answer-wrong-person",
        defaultMessage: "I am not the person to complete this information",
      }),
      NO_REMINDERS: intl.formatMessage({
        id: "public.unsubscribe.answer-no-reminders",
        defaultMessage:
          "I will upload the information but i do not want to receive more reminders",
      }),
      OTHER: intl.formatMessage({
        id: "public.unsubscribe.answer-other",
        defaultMessage: "Other",
      }),
    }),
    [intl.locale]
  );
}
