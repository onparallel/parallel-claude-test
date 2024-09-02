import { Center, Flex } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useMetadata } from "@parallel/utils/withMetadata";
import { isPast, sub } from "date-fns";
import { isNonNullish } from "remeda";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldDateProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFormFieldDate({
  index,
  field,
  expiryDate,
  register,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
}: ProfileFormFieldDateProps) {
  const { browserName } = useMetadata();

  const alertIsActive =
    isNonNullish(expiryDate) &&
    isNonNullish(field.expiryAlertAheadTime) &&
    isPast(sub(new Date(expiryDate), field.expiryAlertAheadTime));

  const { useReplyAsExpiryDate } = field.options as ProfileTypeFieldOptions<"DATE">;

  return (
    <ProfileFormFieldInputGroup
      field={field}
      expiryDate={expiryDate}
      isDisabled={isDisabled}
      showSuggestionsButton={showSuggestionsButton}
      areSuggestionsVisible={areSuggestionsVisible}
      onToggleSuggestions={onToggleSuggestions}
    >
      <Flex flex="1" position="relative">
        <DateInput
          {...register(`fields.${index}.content.value`)}
          borderColor="transparent"
          color={!!useReplyAsExpiryDate && alertIsActive ? "red.500" : undefined}
          onBlur={(e) => {
            if (e.target.value) {
              showExpiryDateDialog({});
            }
          }}
          isDisabled={isDisabled}
        />
        {browserName === "Firefox" ? null : (
          <Center
            boxSize={10}
            position="absolute"
            insetEnd={0}
            bottom={0}
            pointerEvents="none"
            className="date-icon"
            display="none"
          >
            <FieldDateIcon fontSize="18px" />
          </Center>
        )}
      </Flex>
    </ProfileFormFieldInputGroup>
  );
}
