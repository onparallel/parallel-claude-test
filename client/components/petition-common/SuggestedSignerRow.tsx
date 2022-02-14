import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { SuggestedSignerRow_PetitionSignerFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

interface SuggestedSignerRowProps {
  signer: SuggestedSignerRow_PetitionSignerFragment;
  onAddClick: () => void;
}
export function SuggestedSignerRow({ signer, onAddClick }: SuggestedSignerRowProps) {
  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Box>
        {signer.firstName} {signer.lastName} {"<"}
        {signer.email}
        {">"}
      </Box>
      <Button onClick={onAddClick} size="sm">
        <FormattedMessage id="generic.add" defaultMessage="Add" />
      </Button>
    </Flex>
  );
}

SuggestedSignerRow.fragments = {
  PetitionSigner: gql`
    fragment SuggestedSignerRow_PetitionSigner on PetitionSigner {
      firstName
      lastName
      email
    }
  `,
};
