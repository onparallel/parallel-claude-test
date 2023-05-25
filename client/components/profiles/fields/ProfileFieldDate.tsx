import { Center, Flex } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import { useMetadata } from "@parallel/utils/withMetadata";
import { isPast, sub } from "date-fns";
import { isDefined } from "remeda";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldDateProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
  expiryDate?: string | null;
}

export function ProfileFieldDate({
  index,
  field,
  expiryDate,
  register,
  showExpiryDateDialog,
}: ProfileFieldDateProps) {
  const { browserName } = useMetadata();

  const alertIsActive =
    isDefined(expiryDate) &&
    isDefined(field.expiryAlertAheadTime) &&
    isPast(sub(new Date(expiryDate), field.expiryAlertAheadTime));

  return (
    <ProfileFieldInputGroup field={field} expiryDate={expiryDate}>
      <Flex flex="1" position="relative">
        <DateInput
          {...register(`fields.${index}.content.value`)}
          borderColor="transparent"
          color={field.options?.useReplyAsExpiryDate && alertIsActive ? "red.500" : undefined}
          onBlur={(e) => {
            if (e.target.value) {
              showExpiryDateDialog();
            }
          }}
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
