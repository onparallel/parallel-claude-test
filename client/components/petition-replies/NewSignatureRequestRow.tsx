import { gql } from "@apollo/client";
import { Box, Button, GridItem, Heading, Stack, Text } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import {
  NewSignatureRequestRow_PetitionFragment,
  NewSignatureRequestRow_UserFragment,
} from "@parallel/graphql/__types";
import { useStartSignatureRequest } from "@parallel/utils/useStartSignatureRequest";
import { FormattedList, FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { SignerReference } from "../common/SignerReference";

interface NewSignatureRequestRowProps {
  petition: NewSignatureRequestRow_PetitionFragment;
  user: NewSignatureRequestRow_UserFragment;
  onRefetch?: () => void;
  isDisabled?: boolean;
}

export function NewSignatureRequestRow({
  petition,
  user,
  onRefetch,
  isDisabled,
}: NewSignatureRequestRowProps) {
  const signers = petition.signatureConfig?.signers.filter(isDefined) ?? [];

  const { handleStartSignature, buttonLabel } = useStartSignatureRequest({
    user,
    petition,
    onRefetch,
  });

  return (
    <>
      <GridItem padding={2} paddingLeft={4}>
        <Heading size="xs" as="h4" paddingBottom={1}>
          <FormattedMessage
            id="component.petition-signatures-card.status"
            defaultMessage="Status"
          />
        </Heading>
        <Stack direction="row" display="inline-flex" alignItems="center" color="gray.600">
          <TimeIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.not-started"
              defaultMessage="Not started"
            />
          </Text>
        </Stack>
      </GridItem>
      <GridItem padding={2}>
        <Heading size="xs" as="h4" paddingBottom={1}>
          <FormattedMessage
            id="component.petition-signatures-card.signers"
            defaultMessage="Signers"
          />
        </Heading>
        <Box>
          {signers.length > 0 ? (
            <FormattedList
              value={signers.map((signer, i) => (
                <SignerReference signer={signer} key={i} />
              ))}
            />
          ) : (
            <FormattedMessage id="generic.not-specified" defaultMessage="Not specified" />
          )}
        </Box>
      </GridItem>
      <GridItem padding={2} paddingRight={4} marginLeft="auto">
        <Button
          colorScheme="primary"
          marginLeft={2}
          onClick={handleStartSignature}
          isDisabled={isDisabled}
        >
          {buttonLabel}
        </Button>
      </GridItem>
    </>
  );
}

NewSignatureRequestRow.fragments = {
  User: gql`
    fragment NewSignatureRequestRow_User on User {
      ...useStartSignatureRequest_User
    }
    ${useStartSignatureRequest.fragments.User}
  `,
  Petition: gql`
    fragment NewSignatureRequestRow_Petition on Petition {
      ...useStartSignatureRequest_Petition
      signatureConfig {
        signers {
          ...SignerReference_PetitionSigner
        }
      }
    }
    ${useStartSignatureRequest.fragments.Petition}
    ${SignerReference.fragments.PetitionSigner}
  `,
};
