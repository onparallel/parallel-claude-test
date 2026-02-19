import { gql } from "@apollo/client";
import { Center, InputGroup, InputRightElement } from "@chakra-ui/react";
import { EditIcon, TimeAlarmIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { SuggestionsButton } from "@parallel/components/common/SuggestionsButton";
import { ProfileFormFieldInputGroup_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useBrowserMetadata } from "@parallel/utils/useBrowserMetadata";
import { Box, Flex, HStack } from "@parallel/components/ui";
import { Duration, isPast, sub } from "date-fns";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";

export interface ProfileFormFieldInputGroupProps {
  showSuggestionsButton?: boolean;
  areSuggestionsVisible?: boolean;
  onToggleSuggestions?: () => void;
  field: ProfileFormFieldInputGroup_ProfileTypeFieldFragment;
  children?: ReactNode;
  expiryDate?: string | null;
  isDisabled?: boolean;
}

export function ProfileFormFieldInputGroup({
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
  field,
  expiryDate,
  children,
  isDisabled,
}: ProfileFormFieldInputGroupProps) {
  const { browserName } = useBrowserMetadata();

  // If all the props are nullish, we don't need to render the input group
  if (
    isNullish(onToggleSuggestions) &&
    isNullish(showSuggestionsButton) &&
    isNullish(areSuggestionsVisible) &&
    isNullish(expiryDate)
  ) {
    return <>{children}</>;
  }

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
        <Box flex="1" minWidth={0}>
          {children}
        </Box>
        {(field.type === "DATE" && browserName === "Firefox") ||
        [
          "CHECKBOX",
          "SELECT",
          "BACKGROUND_CHECK",
          "ADVERSE_MEDIA_SEARCH",
          "USER_ASSIGNMENT",
        ].includes(field.type) ||
        isDisabled ? null : (
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
      {showSuggestionsButton && isNonNullish(onToggleSuggestions) ? (
        <Box paddingTop={1}>
          <SuggestionsButton
            areSuggestionsVisible={areSuggestionsVisible ?? false}
            onClick={onToggleSuggestions}
          />
        </Box>
      ) : null}
    </HStack>
  );
}

interface ProfileFieldExpiresAtIconProps {
  expiryDate: string;
  expiryAlertAheadTime?: Duration | null;
}

export const ProfileFieldExpiresAtIcon = chakraComponent<"div", ProfileFieldExpiresAtIconProps>(
  function ProfileFieldExpiresAtIcon({ ref, expiryDate, expiryAlertAheadTime, ...props }) {
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

const _fragments = {
  ProfileTypeField: gql`
    fragment ProfileFormFieldInputGroup_ProfileTypeField on ProfileTypeField {
      id
      type
      isExpirable
      expiryAlertAheadTime
    }
  `,
};
