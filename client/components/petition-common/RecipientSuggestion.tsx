import { gql } from "@apollo/client";
import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { RecipientSuggestion_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { PropsWithChildren } from "react";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeIndicator } from "./PetitionFieldTypeIndicator";

export interface RecipientSuggestionProps {
  firstName?: string;
  lastName?: string;
  groupName?: string;
  email: string;
  petitionField: RecipientSuggestion_PetitionFieldFragment;
  petitionFieldIndex: PetitionFieldIndex;
}

export const RecipientSuggestion = Object.assign(
  chakraForwardRef<"button", PropsWithChildren<RecipientSuggestionProps>>(
    function RecipientSuggestion(
      { petitionField, petitionFieldIndex, groupName, firstName, lastName, email, ...props },
      ref,
    ) {
      const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
      return (
        <SmallPopover
          width="auto"
          maxWidth="container.xs"
          content={
            <Stack spacing={0.5}>
              <Text fontSize="sm">
                <Text as="span" textStyle={name ? undefined : "hint"}>
                  {name || (
                    <FormattedMessage
                      id="component.recipient-suggestion.unnamed"
                      defaultMessage="Unnamed"
                    />
                  )}
                </Text>

                <Text as="span">{` <${email}>`}</Text>
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
            <Text as="span" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              {`${name ? name : email} ${groupName ? `(${groupName})` : ""}`.trim()}
            </Text>
          </Button>
        </SmallPopover>
      );
    },
  ),
  {
    fragments: {
      PetitionField: gql`
        fragment RecipientSuggestion_PetitionField on PetitionField {
          id
          title
          type
        }
      `,
    },
  },
);
