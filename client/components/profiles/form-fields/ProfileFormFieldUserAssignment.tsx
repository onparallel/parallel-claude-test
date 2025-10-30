import { Box } from "@chakra-ui/react";
import { UserSelect, UserSelectSelection } from "@parallel/components/common/UserSelect";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { IndicatorsContainerProps, ValueContainerProps, components } from "react-select";
import { isNonNullish } from "remeda";
import { ProfileFormData } from "../ProfileForm";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldUserAssignmentProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog?: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export const ProfileFormFieldUserAssignment = ({
  field,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
  showBaseStyles,
  isRequired,
}: ProfileFormFieldUserAssignmentProps) => {
  const { control } = useFormContext<ProfileFormData>();
  const options = field.options as ProfileTypeFieldOptions<"USER_ASSIGNMENT">;

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeIds: [...excludeUsers],
        allowedUsersInGroupIds: options.allowedUserGroupId
          ? [options.allowedUserGroupId]
          : undefined,
      });
    },
    [_handleSearchUsers],
  );

  return (
    <ProfileFormFieldInputGroup
      field={field}
      expiryDate={expiryDate}
      isDisabled={isDisabled}
      showSuggestionsButton={showSuggestionsButton}
      areSuggestionsVisible={areSuggestionsVisible}
      onToggleSuggestions={onToggleSuggestions}
    >
      <Box width="100%">
        <Controller
          name={`fields.${field.id}.content.value` as const}
          control={control}
          rules={{
            required: isRequired,
          }}
          render={({ field: { value, onChange, onBlur } }) => {
            return (
              <UserSelect
                isClearable
                isDisabled={isDisabled}
                value={value ?? null}
                onChange={(user) => onChange(user?.id ?? null)}
                onBlur={() => {
                  if (isNonNullish(value)) {
                    return showExpiryDateDialog?.({});
                  }
                  onBlur();
                }}
                onSearch={handleSearchUsers}
                styles={
                  showBaseStyles
                    ? undefined
                    : {
                        control: (baseStyles) => ({
                          ...baseStyles,
                          borderColor: "transparent",
                          ":hover": {
                            borderColor: "inherit",
                          },
                          ":focus-within": {
                            borderColor: baseStyles.borderColor,
                          },
                          ":hover, :focus-within": {
                            "[data-rs='value-container']": { paddingInlineEnd: 0 },
                            "[data-rs='indicators-container']": { display: "flex" },
                          },
                        }),
                        valueContainer: (baseStyles) => ({
                          ...baseStyles,
                          paddingInlineEnd: "16px",
                        }),
                        indicatorsContainer: (baseStyles) => ({
                          ...baseStyles,
                          display: "none",
                        }),
                        placeholder: (baseStyles) => ({
                          ...baseStyles,
                          opacity: 0,
                        }),
                      }
                }
                components={{
                  ValueContainer,
                  IndicatorsContainer,
                }}
              />
            );
          }}
        />
      </Box>
    </ProfileFormFieldInputGroup>
  );
};

function ValueContainer(props: ValueContainerProps<UserSelectSelection, false, never>) {
  return (
    <components.ValueContainer
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "value-container" } }}
    />
  );
}

function IndicatorsContainer(props: IndicatorsContainerProps<UserSelectSelection, false, never>) {
  return (
    <components.IndicatorsContainer
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "indicators-container" } }}
    />
  );
}
