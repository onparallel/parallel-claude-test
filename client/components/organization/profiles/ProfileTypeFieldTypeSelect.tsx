import { Flex } from "@chakra-ui/react";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectInstance,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { PROFILE_TYPE_FIELDS, PROFILE_TYPE_FIELD_CONFIG } from "@parallel/utils/profileFields";
import { forwardRef } from "react";
import { OptionProps, SingleValueProps, components } from "react-select";
import { ProfileTypeFieldTypeLabel } from "./ProfileTypeFieldTypeLabel";

export interface ProfileTypeFieldTypeSelectProps extends SimpleSelectProps<ProfileTypeFieldType> {}

export const ProfileTypeFieldTypeSelect = forwardRef<
  SimpleSelectInstance<ProfileTypeFieldType, false>,
  ProfileTypeFieldTypeSelectProps
>(function ProfileTypeFieldTypeSelect({ ...props }, ref) {
  const options = useSimpleSelectOptions(
    (intl) =>
      PROFILE_TYPE_FIELDS.map((type) => ({
        label: PROFILE_TYPE_FIELD_CONFIG[type].label(intl),
        value: type,
      })),
    [],
  );
  return (
    <SimpleSelect
      ref={ref}
      options={options}
      components={{ SingleValue, Option } as any}
      {...props}
    />
  );
});

function SingleValue(props: SingleValueProps<SimpleOption<ProfileTypeFieldType>>) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <ProfileTypeFieldTypeLabel type={props.data.value} />
      </Flex>
    </components.SingleValue>
  );
}

function Option(props: OptionProps<SimpleOption<ProfileTypeFieldType>>) {
  return (
    <components.Option {...props}>
      <Flex>
        <ProfileTypeFieldTypeLabel type={props.data.value} />
      </Flex>
    </components.Option>
  );
}
