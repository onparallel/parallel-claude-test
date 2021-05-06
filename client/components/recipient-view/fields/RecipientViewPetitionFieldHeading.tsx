import { Heading, Stack, Text } from "@chakra-ui/react";
import { BreakLines } from "@parallel/components/common/BreakLines";
import { Linkify } from "@parallel/components/common/Linkify";
import { RecipientViewPetitionFieldCard_PublicPetitionFieldFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export interface RecipientViewPetitionFieldHeadingProps {
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
}

export function RecipientViewPetitionFieldHeading({
  field,
}: RecipientViewPetitionFieldHeadingProps) {
  return (
    <Stack
      as="header"
      id={`field-${field.id}`}
      spacing={1}
      paddingX={2}
      paddingY={2}
    >
      {field.title ? (
        <Heading size="md">{field.title}</Heading>
      ) : (
        <Heading
          size="md"
          color="gray.500"
          fontWeight="normal"
          fontStyle="italic"
        >
          <FormattedMessage
            id="generic.empty-heading"
            defaultMessage="Untitled heading"
          />
        </Heading>
      )}
      {field.description ? (
        <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
          <Linkify>
            <BreakLines>{field.description}</BreakLines>
          </Linkify>
        </Text>
      ) : null}
    </Stack>
  );
}
