import { Box, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import {
  useProfileTypeFieldTypeLabel,
  useProfileTypeFieldTypeColor,
} from "@parallel/utils/profileFields";
import { ProfileTypeFieldTypeIcon } from "./ProfileTypeFieldTypeIcon";

interface ProfileTypeFieldTypeLabelProps {
  type: ProfileTypeFieldType;
}

export const ProfileTypeFieldTypeLabel = chakraForwardRef<"div", ProfileTypeFieldTypeLabelProps>(
  function ProfileTypeFieldTypeLabel({ type, ...props }, ref) {
    const color = useProfileTypeFieldTypeColor(type);
    const label = useProfileTypeFieldTypeLabel(type);
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
          <ProfileTypeFieldTypeIcon
            type={type}
            display="block"
            boxSize="20px"
            role="presentation"
          />
        </Box>
        <Text whiteSpace="nowrap" as="div" flex="1" marginLeft={2}>
          {label}
        </Text>
      </Box>
    );
  },
);
