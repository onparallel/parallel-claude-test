import { Center, Flex } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";
import { useMetadata } from "@parallel/utils/withMetadata";
import { useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldDateProps extends ProfileFieldProps {}

export function ProfileFieldDate({ index }: ProfileFieldDateProps) {
  const { register } = useFormContext<ProfilesFormData>();
  const { browserName } = useMetadata();

  return (
    <ProfileFieldInputGroup>
      <Flex flex="1" position="relative">
        <DateInput borderColor="transparent" {...register(`fields.${index}.content.value`)} />
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
