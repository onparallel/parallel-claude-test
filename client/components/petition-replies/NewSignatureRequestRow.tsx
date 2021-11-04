import { gql } from "@apollo/client";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import {
  NewSignatureRequestRow_PetitionFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { omit } from "remeda";
import { SignerReference } from "../common/SignerReference";
import { useSignerSelectDialog } from "./SignerSelectDialog";

interface NewSignatureRequestRowProps {
  petition: NewSignatureRequestRow_PetitionFragment;
  onUpdateConfig: (data: SignatureConfigInput | null) => Promise<void>;
  onStart: () => void;
}

export function NewSignatureRequestRow({
  petition,
  onUpdateConfig,
  onStart,
}: NewSignatureRequestRowProps) {
  const signers = petition.signatureConfig?.signers ?? [];
  const showSignerSelectDialog = useSignerSelectDialog();
  const handleStartSignature = async () => {
    try {
      if (signers.length === 0) {
        const { signersInfo } = await showSignerSelectDialog({});
        await onUpdateConfig({
          ...omit(petition.signatureConfig!, ["integration", "signers", "__typename"]),
          orgIntegrationId: petition.signatureConfig!.integration!.id,
          signersInfo,
        });
      }
      onStart();
    } catch {}
  };

  return (
    <>
      <Box>
        <Heading size="xs" as="h4">
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
      </Box>
      <Box>
        <Heading size="xs" as="h4">
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
      </Box>
      <Box>
        {petition.status === "PENDING" ? (
          <Button width="24" colorScheme="red" onClick={() => onUpdateConfig(null)}>
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
        ) : (
          <Flex alignItems="center">
            <Button width="24" onClick={() => onUpdateConfig(null)}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
            <Button width="24" colorScheme="purple" marginLeft={2} onClick={handleStartSignature}>
              {signers.length === 0 ? (
                <FormattedMessage
                  id="component.petition-signatures-card.start"
                  defaultMessage="Start..."
                />
              ) : (
                <FormattedMessage id="generic.start" defaultMessage="Start" />
              )}
            </Button>
          </Flex>
        )}
      </Box>
    </>
  );
}

NewSignatureRequestRow.fragments = {
  Petition: gql`
    fragment NewSignatureRequestRow_Petition on Petition {
      status
      signatureConfig {
        signers {
          ...SignerReference_PetitionSigner
        }
        letRecipientsChooseSigners
        integration {
          id
          name
          provider
        }
        review
        timezone
        title
      }
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};
