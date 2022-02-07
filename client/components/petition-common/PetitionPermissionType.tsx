import { forwardRef, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionPermissionType } from "@parallel/graphql/__types";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { SelectProps } from "@parallel/utils/react-select/types";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

export const PetitionPermissionTypeText = chakraForwardRef<
  "span",
  { type: PetitionPermissionType }
>(function PetitionPermissionTypeText({ type, ...props }, ref) {
  return (
    <Text ref={ref as any} as="span" {...props}>
      {type === "OWNER" ? (
        <FormattedMessage id="petition-permission-type.owner" defaultMessage="Owner" />
      ) : type === "WRITE" ? (
        <FormattedMessage id="petition-permission-type.write" defaultMessage="Editor" />
      ) : (
        <FormattedMessage id="petition-permission-type.read" defaultMessage="Reader" />
      )}
    </Text>
  );
});

interface PetitionPermissionTypeSelectProps extends SelectProps {
  permissionType: PetitionPermissionType;
  onPermissionChange: (type: PetitionPermissionType) => void;
  disableOwner?: boolean;
}

export const PetitionPermissionTypeSelect = forwardRef(function PetitionPermissionTypeSelect(
  { permissionType, onPermissionChange, disableOwner, ...props }: PetitionPermissionTypeSelectProps,
  ref
) {
  const reactSelectProps = useReactSelectProps();
  const intl = useIntl();
  const options: Array<{ label: string; value: PetitionPermissionType; isDisabled?: boolean }> = [
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
  ];

  const handleChange = (value: { label: string; value: PetitionPermissionType }) => {
    onPermissionChange(value.value);
  };
  return (
    <Select
      ref={ref}
      value={options.find((o) => o.value === permissionType)}
      onChange={handleChange as any}
      options={options}
      {...props}
      {...reactSelectProps}
    />
  );
});
