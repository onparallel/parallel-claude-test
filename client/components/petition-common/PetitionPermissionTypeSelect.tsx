import { PetitionPermissionType } from "@parallel/graphql/__types";
import { RefAttributes } from "react";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectInstance,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "../common/SimpleSelect";

interface PetitionPermissionTypeSelectProps
  extends Omit<SimpleSelectProps<PetitionPermissionType, false>, "options"> {
  disableOwner?: boolean;
  hideOwner?: boolean;
}

export function PetitionPermissionTypeSelect({
  disableOwner,
  hideOwner,
  ...props
}: PetitionPermissionTypeSelectProps &
  RefAttributes<SimpleSelectInstance<PetitionPermissionType, false>>) {
  const options = useSimpleSelectOptions(
    (intl) => [
      ...(hideOwner
        ? []
        : [
            {
              label: intl.formatMessage({
                id: "generic.petition-permission-type-owner",
                defaultMessage: "Owner",
              }),
              value: "OWNER",
              isDisabled: disableOwner,
            } as SimpleOption<PetitionPermissionType>,
          ]),
      {
        label: intl.formatMessage({
          id: "generic.petition-permission-type-write",
          defaultMessage: "Editor",
        }),
        value: "WRITE",
      },
      {
        label: intl.formatMessage({
          id: "generic.petition-permission-type-reader",
          defaultMessage: "Reader",
        }),
        value: "READ",
      },
    ],
    [disableOwner],
  );

  return <SimpleSelect options={options} {...props} />;
}
