import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePetitionMessagePlaceholderOptions() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-first-name",
          defaultMessage: "Recipient first name",
        }),
        value: "contact-first-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-last-name",
          defaultMessage: "Recipient last name",
        }),
        value: "contact-last-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-full-name",
          defaultMessage: "Recipient full name",
        }),
        value: "contact-full-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-email",
          defaultMessage: "Recipient email",
        }),
        value: "contact-email",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.user-first-name",
          defaultMessage: "My first name",
        }),
        value: "user-first-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.user-last-name",
          defaultMessage: "My last name",
        }),
        value: "user-last-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.user-full-name",
          defaultMessage: "My full name",
        }),
        value: "user-full-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.parallel-title",
          defaultMessage: "Parallel title",
        }),
        value: "petition-title",
      },
    ],
    [intl.locale]
  );
}
