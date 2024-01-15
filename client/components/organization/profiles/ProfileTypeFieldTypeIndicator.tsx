import { HStack, Icon, Text, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { PROFILE_TYPE_FIELD_CONFIG } from "@parallel/utils/profileFields";
import { useIntl } from "react-intl";

export interface ProfileTypeFieldTypeIndicatorProps {
  type: ProfileTypeFieldType;
  fieldIndex: number;
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
  const intl = useIntl();
  const { label, color, icon } = PROFILE_TYPE_FIELD_CONFIG[type];

  return (
    <Tooltip label={label(intl)} isDisabled={isTooltipDisabled}>
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
        {hideIcon ? null : <Icon as={icon} boxSize="16px" role="presentation" />}
        <Text width={5} as="span" fontSize="xs" marginLeft={hideIcon ? 0 : 0.5} textAlign="center">
          {fieldIndex}
        </Text>
      </HStack>
    </Tooltip>
  );
});
