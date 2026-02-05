import { Box, Icon } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PaidBadge } from "@parallel/components/common/PaidBadge";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { PROFILE_TYPE_FIELD_CONFIG } from "@parallel/utils/profileFields";
import { useHasAdverseMediaSearch } from "@parallel/utils/useHasAdverseMediaSearch";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { useIntl } from "react-intl";
import { Text } from "@parallel/components/ui";

interface ProfileTypeFieldTypeLabelProps {
  type: ProfileTypeFieldType;
}

export const ProfileTypeFieldTypeLabel = chakraForwardRef<"div", ProfileTypeFieldTypeLabelProps>(
  function ProfileTypeFieldTypeLabel({ type, ...props }, ref) {
    const intl = useIntl();
    const { label, color, icon } = PROFILE_TYPE_FIELD_CONFIG[type];

    const hasBackgroundCheck = useHasBackgroundCheck();
    const hasAdverseMediaSearch = useHasAdverseMediaSearch();

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
        {(!hasAdverseMediaSearch && type === "ADVERSE_MEDIA_SEARCH") ||
        (!hasBackgroundCheck && type === "BACKGROUND_CHECK") ? (
          <PaidBadge marginStart={2} />
        ) : null}
      </Box>
    );
  },
);
