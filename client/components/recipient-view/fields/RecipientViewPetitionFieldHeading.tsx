import { Heading, Stack, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { RecipientViewPetitionFieldCard_PublicPetitionFieldFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { BreakLines } from "@parallel/components/common/BreakLines";

export interface RecipientViewPetitionFieldHeadingProps {
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
}

export const RecipientViewPetitionFieldHeading = chakraForwardRef<
  "header",
  RecipientViewPetitionFieldHeadingProps
>(function ({ field, ...props }, ref) {
  return (
    <Stack
      as="header"
      ref={ref as any}
      spacing={1}
      paddingX={2}
      paddingY={2}
      {...props}
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
          <BreakLines text={field.description} />
        </Text>
      ) : null}
    </Stack>
  );
});
