import { PetitionUserNotificationFilter } from "@parallel/graphql/__types";
import { useFieldSelectReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useEffect, useMemo } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";

export function NotificationsSelect({
  onChange,
  selectedOption,
}: {
  onChange: (arg0: PetitionUserNotificationFilter) => void;
  selectedOption: PetitionUserNotificationFilter;
}) {
  const reactSelectProps = useFieldSelectReactSelectProps({});
  const intl = useIntl();

  const options = useMemo(
    () => [
      {
        label: intl.formatMessage({
          id: "component.notifications-select.all-notifications",
          defaultMessage: "All notifications",
        }),
        value: "ALL",
      },
      {
        label: intl.formatMessage({
          id: "component.notifications-select.unread",
          defaultMessage: "Unread",
        }),
        value: "UNREAD",
      },
      {
        label: intl.formatMessage({
          id: "component.notifications-select.comments",
          defaultMessage: "Comments",
        }),
        value: "COMMENTS",
      },
      {
        label: intl.formatMessage({
          id: "component.notifications-select.completed",
          defaultMessage: "Completed",
        }),
        value: "COMPLETED",
      },
      {
        label: intl.formatMessage({
          id: "component.notifications-select.SHARED",
          defaultMessage: "Shared",
        }),
        value: "SHARED",
      },
      {
        label: intl.formatMessage({
          id: "component.notifications-select.others",
          defaultMessage: "Others",
        }),
        value: "OTHER",
      },
    ],
    [intl.locale]
  );

  useEffect(() => {
    console.log("%c --- NotificationsSelect RENDER ---", "color: #63676e");
  });

  return (
    <Select
      options={options}
      value={options.find((o) => o.value === selectedOption)}
      onChange={(selected) =>
        onChange((selected?.value as PetitionUserNotificationFilter) ?? "ALL")
      }
      {...reactSelectProps}
    />
  );
}
