import { PetitionPermissionType } from "@parallel/graphql/__types";
import { Focusable } from "@parallel/utils/types";
import { forwardRef } from "react";
import { SimpleSelect, SimpleSelectProps, useSimpleSelectOptions } from "../common/SimpleSelect";

interface PetitionPermissionTypeSelectProps
  extends Omit<SimpleSelectProps<PetitionPermissionType, false>, "options"> {
  disableOwner?: boolean;
}

export const PetitionPermissionTypeSelect = forwardRef<
  Focusable,
  PetitionPermissionTypeSelectProps
>(function PetitionPermissionTypeSelect({ disableOwner, ...props }, ref) {
  const options = useSimpleSelectOptions(
    (intl) => [
      {
        label: intl.formatMessage({
          id: "petition-permission-type.write",
          defaultMessage: "Editor",
        }),
        value: "WRITE",
      },
      {
        label: intl.formatMessage({
          id: "petition-permission-type.owner",
          defaultMessage: "Owner",
        }),
        value: "OWNER",
        isDisabled: disableOwner,
      },
    ],
    [disableOwner]
  );

  return <SimpleSelect ref={ref as any} options={options} {...props} />;
});
