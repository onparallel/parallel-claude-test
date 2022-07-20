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
import { isDefined, omit } from "remeda";
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
  isDisabled?: boolean;
}

export function NewSignatureRequestRow({
  petition,
  user,
  onUpdateConfig,
  onStart,
  isDisabled,
}: NewSignatureRequestRowProps) {
  const signers = petition.signatureConfig?.signers.filter(isDefined) ?? [];
  const allowAdditionalSigners = petition.signatureConfig?.allowAdditionalSigners ?? false;
  const reviewBeforeSigning = petition.signatureConfig?.review ?? false;
  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();

  const startSignature = reviewBeforeSigning || petition.status === "COMPLETED";

  const handleStartSignature = async () => {
    try {
      const {
        signers: signersInfo,
        message,
        allowAdditionalSigners: allowMoreSigners,
      } = await showConfirmPetitionSignersDialog({
        user,
        accesses: petition.accesses,
        presetSigners: signers,
        allowAdditionalSigners,
        isUpdate: !startSignature,
        previousSignatures: petition.signatureRequests,
      });

      await onUpdateConfig({
        ...omit(petition.signatureConfig!, ["integration", "signers", "__typename"]),
        orgIntegrationId: petition.signatureConfig!.integration!.id,
        allowAdditionalSigners: allowMoreSigners,
        signersInfo,
      });

      if (startSignature) onStart(message);
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
      <Box padding={2} paddingRight={4} marginLeft="auto">
        <Flex alignItems="center">
          <Button width="24" onClick={() => onUpdateConfig(null)} isDisabled={isDisabled}>
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
          <Button
            colorScheme="primary"
            marginLeft={2}
            onClick={handleStartSignature}
            isDisabled={isDisabled}
          >
            {startSignature ? (
              <FormattedMessage
                id="component.petition-signatures-card.start"
                defaultMessage="Start..."
              />
            ) : (
              <FormattedMessage
                id="component.petition-signatures-card.edit-signers"
                defaultMessage="Edit signers"
              />
            )}
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
      status
      signatureConfig {
        signers {
          ...SignerReference_PetitionSigner
          ...ConfirmPetitionSignersDialog_PetitionSigner
        }
        allowAdditionalSigners
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
      signatureRequests {
        ...ConfirmPetitionSignersDialog_PetitionSignatureRequest
      }
    }
    ${SignerReference.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.PetitionAccess}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSignatureRequest}
  `,
};
