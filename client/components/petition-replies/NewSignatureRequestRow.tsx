import { gql } from "@apollo/client";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import {
  Maybe,
  NewSignatureRequestRow_PetitionFragment,
  NewSignatureRequestRow_UserFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { omit } from "remeda";
import { SignerReference } from "../common/SignerReference";
import {
  ConfirmPetitionSignersDialog,
  useConfirmPetitionSignersDialog,
} from "../petition-common/dialogs/ConfirmPetitionSignersDialog";

interface NewSignatureRequestRowProps {
  petition: NewSignatureRequestRow_PetitionFragment;
  user: NewSignatureRequestRow_UserFragment;
  onUpdateConfig: (data: SignatureConfigInput | null) => Promise<void>;
  onStart: (message?: Maybe<string>) => void;
}

export function NewSignatureRequestRow({
  petition,
  user,
  onUpdateConfig,
  onStart,
}: NewSignatureRequestRowProps) {
  const signers = petition.signatureConfig?.signers ?? [];
  const allowAdditionalSigners = petition.signatureConfig?.letRecipientsChooseSigners ?? false;
  const reviewBeforeSigning = petition.signatureConfig?.review ?? false;
  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();
  const handleStartSignature = async () => {
    try {
      const { signers: signersInfo, message } = await showConfirmPetitionSignersDialog({
        user,
        accesses: petition.accesses,
        fixedSigners: signers,
        reviewBeforeSigning,
        allowAdditionalSigners,
      });

      if (allowAdditionalSigners || reviewBeforeSigning) {
        await onUpdateConfig({
          ...omit(petition.signatureConfig!, ["integration", "signers", "__typename"]),
          orgIntegrationId: petition.signatureConfig!.integration!.id,
          signersInfo,
        });
      }

      onStart(message);
    } catch {}
  };

  return (
    <>
      <Box padding={2} paddingLeft={4}>
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
      <Box padding={2}>
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
      <Box padding={2} paddingRight={4}>
        <Flex alignItems="center">
          <Button width="24" onClick={() => onUpdateConfig(null)}>
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
          <Button width="24" colorScheme="purple" marginLeft={2} onClick={handleStartSignature}>
            <FormattedMessage
              id="component.petition-signatures-card.start"
              defaultMessage="Start..."
            />
          </Button>
        </Flex>
      </Box>
    </>
  );
}

NewSignatureRequestRow.fragments = {
  User: gql`
    fragment NewSignatureRequestRow_User on User {
      ...ConfirmPetitionSignersDialog_User
    }
    ${ConfirmPetitionSignersDialog.fragments.User}
  `,
  Petition: gql`
    fragment NewSignatureRequestRow_Petition on Petition {
      signatureConfig {
        signers {
          ...SignerReference_PetitionSigner
          ...ConfirmPetitionSignersDialog_PetitionSigner
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
      accesses {
        ...ConfirmPetitionSignersDialog_PetitionAccess
      }
    }
    ${SignerReference.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.PetitionAccess}
  `,
};
