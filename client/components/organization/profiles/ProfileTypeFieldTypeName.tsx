import { Box, HStack, Icon } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  LocalizableUserText,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PaidBadge } from "@parallel/components/common/PaidBadge";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { PROFILE_TYPE_FIELD_CONFIG } from "@parallel/utils/profileFields";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { useIntl } from "react-intl";

interface ProfileTypeFieldTypeNameProps {
  type: ProfileTypeFieldType;
  name: LocalizableUserText;
}

export const ProfileTypeFieldTypeName = chakraForwardRef<"div", ProfileTypeFieldTypeNameProps>(
  function ProfileTypeFieldTypeName({ type, name, ...props }, ref) {
    const intl = useIntl();
    const { color, icon } = PROFILE_TYPE_FIELD_CONFIG[type];

    const hasBackgroundCheck = useHasBackgroundCheck();

    const label = localizableUserTextRender({
      value: name,
      intl,
      default: intl.formatMessage({
        id: "generic.unnamed-profile-type-field",
        defaultMessage: "Unnamed property",
      }),
    });

    return (
      <HStack ref={ref} minWidth={0} alignItems="center" {...props}>
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
        <OverflownText as="span" flex={1}>
          {label}
        </OverflownText>
        {!hasBackgroundCheck && type === "BACKGROUND_CHECK" ? <PaidBadge marginStart={2} /> : null}
      </HStack>
    );
  },
);
