import { Center, Flex } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";
import { useMetadata } from "@parallel/utils/withMetadata";
import { useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";
import { isPast, sub } from "date-fns";
import { isDefined } from "remeda";

interface ProfileFieldDateProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
}

export function ProfileFieldDate({ index, field, showExpiryDateDialog }: ProfileFieldDateProps) {
  const { register, watch } = useFormContext<ProfilesFormData>();
  const expiryDate = watch(`fields.${index}.expiryDate`);
  const { browserName } = useMetadata();

  const alertIsActive =
    isDefined(expiryDate) &&
    isDefined(field.expiryAlertAheadTime) &&
    isPast(sub(new Date(expiryDate), field.expiryAlertAheadTime));

  return (
    <ProfileFieldInputGroup index={index} field={field}>
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
