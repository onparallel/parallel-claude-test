import Select from "react-select";
import { useFieldSelectReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptionType } from "@parallel/utils/react-select/types";
import { useIntl } from "react-intl";
import { useState } from "react";

export function NotificationsSelect() {
  const reactSelectProps = useFieldSelectReactSelectProps({});
  const intl = useIntl();

  const [selected, setSelected] = useState({
    label: intl.formatMessage({
      id: "component.notifications-select.all-notifications",
      defaultMessage: "All notifications",
    }),
    value: "ALL",
  });

  const options = [
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
      value: "OTHERS",
    },
  ];

  const handleChangeSelect = (_selected: OptionType | null) => {
    if (_selected && _selected.value != selected?.value) {
      setSelected(_selected);
    }
  };

  return (
    <Select
      options={options}
      value={selected}
      onChange={handleChangeSelect}
      {...reactSelectProps}
    />
  );
}
