import { HStack, Icon, Text } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { PROFILE_TYPE_FIELD_CONFIG } from "@parallel/utils/profileFields";
import { useIntl } from "react-intl";

export interface ProfileTypeFieldTypeIndicatorProps {
  type: ProfileTypeFieldType;
  fieldIndex?: number;
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
        minWidth={fieldIndex ? 8 : undefined}
        borderRadius="sm"
        paddingX={1}
        spacing={0.5}
        minH={5}
        justifyContent={hideIcon ? "center" : "space-between"}
        {...props}
      >
        {hideIcon ? null : <Icon as={icon} boxSize="16px" role="presentation" />}
        {fieldIndex ? (
          <Text width={5} as="span" fontSize="xs" textAlign="center">
            {fieldIndex}
          </Text>
        ) : null}
      </HStack>
    </Tooltip>
  );
});
