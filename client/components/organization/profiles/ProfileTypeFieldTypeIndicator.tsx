import { HStack, Text, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import {
  useProfileTypeFieldTypeColor,
  useProfileTypeFieldTypeLabel,
} from "@parallel/utils/profileFields";
import { ProfileTypeFieldTypeIcon } from "./ProfileTypeFieldTypeIcon";

export interface ProfileTypeFieldTypeIndicatorProps {
  type: ProfileTypeFieldType;
  fieldIndex: PetitionFieldIndex;
  isTooltipDisabled?: boolean;
  hideIcon?: boolean;
}

export const ProfileTypeFieldTypeIndicator = chakraForwardRef<
  "div",
  ProfileTypeFieldTypeIndicatorProps
>(function ProfileTypeFieldTypeIndicator(
  { type, fieldIndex, isTooltipDisabled, hideIcon, ...props }: ProfileTypeFieldTypeIndicatorProps,
  ref,
) {
  const label = useProfileTypeFieldTypeLabel(type);
  const color = useProfileTypeFieldTypeColor(type);

  return (
    <Tooltip label={label} isDisabled={isTooltipDisabled}>
      <HStack
        ref={ref}
        backgroundColor={color}
        color="white"
        alignItems="center"
        minWidth={8}
        borderRadius="sm"
        paddingX={1}
        spacing={0.5}
        minH={5}
        justifyContent="space-between"
        {...props}
      >
        {hideIcon ? null : (
          <ProfileTypeFieldTypeIcon type={type} boxSize="16px" role="presentation" />
        )}
        <Text width={5} as="span" fontSize="xs" marginLeft={hideIcon ? 0 : 0.5} textAlign="center">
          {fieldIndex}
        </Text>
      </HStack>
    </Tooltip>
  );
});
