import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePetitionMessagePlaceholderOptions() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        label: intl.formatMessage({
          id: "petition-message.placeholder-option.contact-name",
          defaultMessage: "Contact name",
        }),
        value: "contact_name",
      },
    ],
    [intl.locale]
  );
}
