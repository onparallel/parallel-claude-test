import { PetitionPermissionType } from "@parallel/graphql/__types";
import { UseReactSelectProps, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps, OptionType } from "@parallel/utils/react-select/types";
import { Focusable } from "@parallel/utils/types";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";

interface PetitionPermissionTypeSelectProps
  extends UseReactSelectProps,
    CustomSelectProps<PetitionPermissionType, false> {
  disableOwner?: boolean;
}

export const PetitionPermissionTypeSelect = forwardRef<
  Focusable,
  PetitionPermissionTypeSelectProps
>(function PetitionPermissionTypeSelect({ value, onChange, disableOwner, ...props }, ref) {
  const reactSelectProps = useReactSelectProps<OptionType<PetitionPermissionType>, false, never>(
    props
  );
  const intl = useIntl();
  const options: OptionType<PetitionPermissionType>[] = useMemo(
    () => [
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
    [intl.locale, disableOwner]
  );

  const _ref = useRef<Select<OptionType<PetitionPermissionType>, false, never>>(null);
  useImperativeHandle(ref, () => ({
    focus: () => {
      setTimeout(() => _ref.current?.focus());
    },
  }));

  const handleChange = (value: { label: string; value: PetitionPermissionType }) => {
    onChange(value.value);
  };
  return (
    <Select
      ref={_ref}
      value={options.find((o) => o.value === value)}
      onChange={handleChange as any}
      options={options}
      {...reactSelectProps}
    />
  );
});
