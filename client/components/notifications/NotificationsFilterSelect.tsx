import { PetitionUserNotificationFilter } from "@parallel/graphql/__types";
import { assignRef } from "@parallel/utils/assignRef";
import { useFieldSelectReactSelectProps } from "@parallel/utils/react-select/hooks";
import { Focusable } from "@parallel/utils/types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { forwardRef, useMemo, useRef } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";

export const NotificationsFilterSelect = forwardRef<
  Focusable,
  ValueProps<PetitionUserNotificationFilter>
>(function NotificationsFilterSelect({ value, onChange }, ref) {
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

  const _value = options.find((o) => o.value === value) ?? null;

  const _ref = useRef<Select<any, false, never>>(null);
  assignRef(ref, {
    focus: () => setTimeout(() => _ref.current?.focus()),
  });

  return (
    <Select
      ref={_ref}
      options={options}
      value={_value}
      onChange={(selected) =>
        onChange((selected?.value as PetitionUserNotificationFilter) ?? "ALL")
      }
      {...reactSelectProps}
    />
  );
});
