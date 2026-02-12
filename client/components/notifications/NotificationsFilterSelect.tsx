import { RefAttributes } from "react";
import {
  SimpleSelect,
  SimpleSelectInstance,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "../common/SimpleSelect";

type NotificationsFilter = "ALL" | "UNREAD" | "COMMENTS" | "COMPLETED" | "SHARED" | "OTHER";

export function NotificationsFilterSelect(
  props: Omit<SimpleSelectProps<NotificationsFilter, false>, "options"> &
    RefAttributes<SimpleSelectInstance<NotificationsFilter, false>>,
) {
  const options = useSimpleSelectOptions(
    (intl) => [
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
          id: "component.notifications-select.shared",
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
    [],
  );
  return <SimpleSelect options={options} isSearchable={false} {...props} />;
}
