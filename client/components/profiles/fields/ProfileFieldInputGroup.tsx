import { gql } from "@apollo/client";
import { Box, Center, Flex, HStack, InputGroup, InputRightElement } from "@chakra-ui/react";
import { EditIcon, TimeAlarmIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { ProfileFieldInputGroup_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useMetadata } from "@parallel/utils/withMetadata";
import { isPast, sub } from "date-fns";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface ProfileFieldInputGroupProps {
  field: ProfileFieldInputGroup_ProfileTypeFieldFragment;
  children: ReactNode;
  expiryDate?: string | null;
}

export function ProfileFieldInputGroup({
  field,
  expiryDate,
  children,
}: ProfileFieldInputGroupProps) {
  const { browserName } = useMetadata();
  return (
    <HStack align="start">
      <InputGroup
        _hover={{
          "& .edit-icon": {
            opacity: 1,
          },
        }}
        _focusWithin={{
          "& .edit-icon": {
            display: "none",
          },
          "& .date-icon": {
            display: "flex",
          },
        }}
        sx={{
          "input:not(:focus)": {
            textOverflow: "ellipsis",
          },
        }}
      >
        {children}
        {browserName === "Firefox" && field.type === "DATE" ? null : (
          <InputRightElement pointerEvents="none">
            <Flex className="edit-icon" opacity={0} transitionDuration="normal" color="gray.600">
              <EditIcon boxSize={4} />
            </Flex>
          </InputRightElement>
        )}
      </InputGroup>
      {field.isExpirable && expiryDate ? (
        <ProfileFieldExpiresAtIcon
          expiryDate={expiryDate}
          expiryAlertAheadTime={field.expiryAlertAheadTime}
        />
      ) : null}
    </HStack>
  );
}

interface ProfileFieldExpiresAtIconProps {
  expiryDate: string;
  expiryAlertAheadTime?: Duration | null;
}

export const ProfileFieldExpiresAtIcon = chakraForwardRef<"div", ProfileFieldExpiresAtIconProps>(
  function ProfileFieldExpiresAtIcon({ expiryDate, expiryAlertAheadTime, ...props }, ref) {
    const intl = useIntl();

    const alertIsActive =
      expiryDate && expiryAlertAheadTime
        ? isPast(sub(new Date(expiryDate!), expiryAlertAheadTime!))
        : false;

    return (
      <Center padding={1} paddingTop={3} {...props} ref={ref}>
        <SmallPopover
          content={
            <Box fontSize="sm">
              {alertIsActive ? (
                <FormattedMessage
                  id="component.profile-field-input-group.alert-active"
                  defaultMessage="The property is expired or about to expire. Update it to deactivate this alert."
                />
              ) : (
                <FormattedMessage
                  id="component.profile-field-input-group.alert-inactive"
                  defaultMessage="The alert will be activated on {date}."
                  values={{
                    date: intl.formatDate(expiryDate!, { ...FORMATS.LL, timeZone: "UTC" }),
                  }}
                />
              )}
            </Box>
          }
          placement="bottom"
        >
          <TimeAlarmIcon color={alertIsActive ? "yellow.500" : "gray.400"} />
        </SmallPopover>
      </Center>
    );
  },
);

ProfileFieldInputGroup.fragments = {
  get ProfileTypeField() {
    return gql`
      fragment ProfileFieldInputGroup_ProfileTypeField on ProfileTypeField {
        id
        type
        isExpirable
        expiryAlertAheadTime
      }
    `;
  },
};
