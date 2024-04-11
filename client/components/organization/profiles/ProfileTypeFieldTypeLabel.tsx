import { Box, Icon, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PaidBadge } from "@parallel/components/common/PaidBadge";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { PROFILE_TYPE_FIELD_CONFIG } from "@parallel/utils/profileFields";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { useIntl } from "react-intl";

interface ProfileTypeFieldTypeLabelProps {
  type: ProfileTypeFieldType;
}

export const ProfileTypeFieldTypeLabel = chakraForwardRef<"div", ProfileTypeFieldTypeLabelProps>(
  function ProfileTypeFieldTypeLabel({ type, ...props }, ref) {
    const intl = useIntl();
    const { label, color, icon } = PROFILE_TYPE_FIELD_CONFIG[type];

    const hasBackgroundCheck = useHasBackgroundCheck();

    return (
      <Box ref={ref} display="inline-flex" alignItems="center" {...props}>
        <Box
          backgroundColor={color}
          color="white"
          borderRadius="md"
          padding={1}
          width="28px"
          height="28px"
        >
          <Icon as={icon} type={type} display="block" boxSize="20px" role="presentation" />
        </Box>
        <Text whiteSpace="nowrap" as="div" flex="1" marginStart={2}>
          {label(intl)}
        </Text>
        {!hasBackgroundCheck && type === "BACKGROUND_CHECK" ? <PaidBadge marginLeft={2} /> : null}
      </Box>
    );
  },
);
