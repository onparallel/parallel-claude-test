import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePetitionMessagePlaceholderOptions() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-first-name",
          defaultMessage: "Contact first name",
        }),
        value: "contact-first-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-last-name",
          defaultMessage: "Contact last name",
        }),
        value: "contact-last-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-full-name",
          defaultMessage: "Contact full name",
        }),
        value: "contact-full-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-email",
          defaultMessage: "Contact email",
        }),
        value: "contact-email",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.user-first-name",
          defaultMessage: "User first name",
        }),
        value: "user-first-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.user-last-name",
          defaultMessage: "User last name",
        }),
        value: "user-last-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.user-full-name",
          defaultMessage: "User full name",
        }),
        value: "user-full-name",
      },
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.petition-title",
          defaultMessage: "Petition title",
        }),
        value: "petition-title",
      },
    ],
    [intl.locale]
  );
}
