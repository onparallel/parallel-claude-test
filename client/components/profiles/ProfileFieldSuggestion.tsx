import { gql } from "@apollo/client";
import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { ProfileFieldSuggestion_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";

interface ProfileFieldSuggestionProps {
  petitionField: ProfileFieldSuggestion_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  replyId: string;
  value: string;
  onReplyClick: () => void;
}

export function ProfileFieldSuggestion({
  petitionField,
  fieldIndex,
  replyId,
  value,
  onReplyClick,
}: ProfileFieldSuggestionProps) {
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
              fieldIndex={fieldIndex}
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
        key={replyId}
        onClick={onReplyClick}
        variant="outline"
        size="xs"
        colorScheme="purple"
        fontWeight={400}
        fontSize="sm"
        maxWidth="218px"
      >
        <Text as="span" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          {value}
        </Text>
      </Button>
    </SmallPopover>
  );
}

ProfileFieldSuggestion.fragments = {
  get PetitionFieldReply() {
    return gql`
      fragment ProfileFieldSuggestion_PetitionFieldReply on PetitionFieldReply {
        id
        status
        content
        isAnonymized
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment ProfileFieldSuggestion_PetitionField on PetitionField {
        id
        title
        type
        visibility
        options
        position
        multiple
        isInternal
        isReadOnly
        alias
        replies {
          ...ProfileFieldSuggestion_PetitionFieldReply
        }
      }
      ${this.PetitionFieldReply}
    `;
  },
  get ProfileTypeField() {
    return gql`
      fragment ProfileFieldSuggestion_ProfileTypeField on ProfileTypeField {
        id
        alias
        type
      }
    `;
  },
};
