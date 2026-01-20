import { gql } from "@apollo/client";
import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ProfileFieldSuggestion_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { PropsWithChildren } from "react";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";

interface ProfileFieldSuggestionProps {
  petitionField: ProfileFieldSuggestion_PetitionFieldFragment;
  petitionFieldIndex: PetitionFieldIndex;
  icon?: React.ReactNode;
}

export const ProfileFieldSuggestion = chakraForwardRef<
  "button",
  PropsWithChildren<ProfileFieldSuggestionProps>
>(function ProfileFieldSuggestion(
  { petitionField, petitionFieldIndex, children, icon, ...props },
  ref,
) {
  return (
    <SmallPopover
      width="auto"
      maxWidth="container.xs"
      content={
        <Stack spacing={0.5}>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.profile-field-suggestion.popover"
              defaultMessage="Suggested reply from:"
            />
          </Text>
          <HStack align="start">
            <PetitionFieldTypeIndicator
              as="span"
              type={petitionField.type}
              fieldIndex={petitionFieldIndex}
              hideIcon
            />
            <Text fontSize="sm" noOfLines={2}>
              {petitionField.title || (
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              )}
            </Text>
          </HStack>
        </Stack>
      }
      placement="bottom"
    >
      <Button
        ref={ref}
        variant="outline"
        size="xs"
        colorScheme="purple"
        fontWeight={400}
        fontSize="sm"
        maxWidth="218px"
        {...props}
      >
        {icon}
        <Text as="span" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          {children}
        </Text>
      </Button>
    </SmallPopover>
  );
});

const _fragments = {
  PetitionField: gql`
    fragment ProfileFieldSuggestion_PetitionField on PetitionField {
      id
      title
      type
    }
  `,
};
