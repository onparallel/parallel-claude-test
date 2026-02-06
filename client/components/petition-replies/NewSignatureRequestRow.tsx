import { gql } from "@apollo/client";
import { Box, GridItem, Heading, Stack } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import { Button, Text } from "@parallel/components/ui";
import { NewSignatureRequestRow_PetitionFragment } from "@parallel/graphql/__types";
import { useStartSignatureRequest } from "@parallel/utils/useStartSignatureRequest";
import { FormattedList, FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { SignerReference } from "../common/SignerReference";

interface NewSignatureRequestRowProps {
  petition: NewSignatureRequestRow_PetitionFragment;
  onRefetch?: () => void;
  isDisabled?: boolean;
}

export function NewSignatureRequestRow({
  petition,
  onRefetch,
  isDisabled,
}: NewSignatureRequestRowProps) {
  const signers = petition.signatureConfig?.signers.filter(isNonNullish) ?? [];

  const { handleStartSignature, buttonLabel } = useStartSignatureRequest({
    petition,
    onRefetch,
    options: { redirect: false },
  });

  return (
    <>
      <GridItem padding={2} paddingStart={4}>
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
      <GridItem padding={2} paddingEnd={4} marginStart="auto">
        <Button
          colorPalette="primary"
          marginStart={2}
          onClick={handleStartSignature}
          disabled={isDisabled}
        >
          {buttonLabel}
        </Button>
      </GridItem>
    </>
  );
}

const _fragments = {
  Petition: gql`
    fragment NewSignatureRequestRow_Petition on Petition {
      ...useStartSignatureRequest_Petition
      signatureConfig {
        signers {
          ...SignerReference_PetitionSigner
        }
      }
    }
  `,
};
