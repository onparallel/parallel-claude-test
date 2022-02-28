import { gql } from "@apollo/client";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { SuggestedSigners_PetitionSignerFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

interface SuggestedSignersProps {
  suggestions: SuggestedSigners_PetitionSignerFragment[];
  onAddSigner: (s: SuggestedSigners_PetitionSignerFragment) => void;
}
export function SuggestedSigners({ suggestions, onAddSigner }: SuggestedSignersProps) {
  return suggestions.length > 0 ? (
    <>
      <Text fontWeight="bold" marginTop={4}>
        <FormattedMessage id="component.suggested-signers.header" defaultMessage="Suggested:" />
      </Text>
      <Stack marginTop={2} paddingLeft={2}>
        {suggestions.map((signer, i) => (
          <Flex key={i} justifyContent="space-between" alignItems="center">
            <Box>
              {signer.firstName} {signer.lastName} {"<"}
              {signer.email}
              {">"}
            </Box>
            <Button onClick={() => onAddSigner(signer)} size="sm">
              <FormattedMessage id="generic.add" defaultMessage="Add" />
            </Button>
          </Flex>
        ))}
      </Stack>
    </>
  ) : null;
}

SuggestedSigners.fragments = {
  PetitionSigner: gql`
    fragment SuggestedSigners_PetitionSigner on PetitionSigner {
      firstName
      lastName
      email
    }
  `,
};
