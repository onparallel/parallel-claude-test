import { gql } from "@apollo/client";
import { chakraComponent } from "@parallel/chakra/utils";
import { Button, HStack, Stack, Text } from "@parallel/components/ui";
import { ProfileFieldSuggestion_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { PropsWithChildren, ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";

interface ProfileFieldSuggestionProps {
  petitionField: ProfileFieldSuggestion_PetitionFieldFragment;
  petitionFieldIndex: PetitionFieldIndex;
  icon?: ReactNode;
}

export const ProfileFieldSuggestion = chakraComponent<
  "button",
  PropsWithChildren<ProfileFieldSuggestionProps>
>(function ProfileFieldSuggestion({
  ref,
  petitionField,
  petitionFieldIndex,
  children,
  icon,
  ...props
}) {
  return (
    <SmallPopover
      width="auto"
      maxWidth="container.xs"
      content={
        <Stack gap={0.5}>
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

            <Text fontSize="sm" lineClamp={2}>
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
        colorPalette="purple"
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
