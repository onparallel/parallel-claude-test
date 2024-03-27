import { Center, Flex } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import { useMetadata } from "@parallel/utils/withMetadata";
import { isPast, sub } from "date-fns";
import { isDefined } from "remeda";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup, ProfileFieldInputGroupProps } from "./ProfileFieldInputGroup";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";

interface ProfileFieldDateProps
  extends ProfileFieldProps,
    Omit<ProfileFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFieldDate({
  index,
  field,
  expiryDate,
  register,
  isDisabled,
  showExpiryDateDialog,
  ...props
}: ProfileFieldDateProps) {
  const { browserName } = useMetadata();

  const alertIsActive =
    isDefined(expiryDate) &&
    isDefined(field.expiryAlertAheadTime) &&
    isPast(sub(new Date(expiryDate), field.expiryAlertAheadTime));

  const { useReplyAsExpiryDate } = field.options as ProfileTypeFieldOptions<"DATE">;

  return (
    <ProfileFieldInputGroup
      {...props}
      field={field}
      expiryDate={expiryDate}
      isDisabled={isDisabled}
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
            right={0}
            bottom={0}
            pointerEvents="none"
            className="date-icon"
            display="none"
          >
            <FieldDateIcon fontSize="18px" />
          </Center>
        )}
      </Flex>
    </ProfileFieldInputGroup>
  );
}
