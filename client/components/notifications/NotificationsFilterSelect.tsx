import { Focusable } from "@parallel/utils/types";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { SelectInstance } from "react-select";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "../common/SimpleSelect";

type NotificationsFilter = "ALL" | "UNREAD" | "COMMENTS" | "COMPLETED" | "SHARED" | "OTHER";

export const NotificationsFilterSelect = forwardRef<
  Focusable,
  Omit<SimpleSelectProps<NotificationsFilter, false>, "options">
>(function NotificationsFilterSelect(props, ref) {
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
    []
  );

  const _ref = useRef<SelectInstance<SimpleOption<NotificationsFilter>, false>>(null);
  useImperativeHandle(ref, () => ({
    focus: () => {
      _ref.current?.focus();
    },
  }));

  return <SimpleSelect ref={_ref} options={options} isSearchable={false} {...props} />;
});
