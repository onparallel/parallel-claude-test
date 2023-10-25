import { gql } from "@apollo/client";
import { Box, Button, GridItem, Heading, Stack, Text } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import {
  NewSignatureRequestRow_PetitionFragment,
  NewSignatureRequestRow_UserFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedList, FormattedMessage } from "react-intl";
import { isDefined, omit } from "remeda";
import { SignerReference } from "../common/SignerReference";
import {
  ConfirmPetitionSignersDialog,
  useConfirmPetitionSignersDialog,
} from "../petition-common/dialogs/ConfirmPetitionSignersDialog";
import { usePetitionCanFinalize } from "@parallel/utils/usePetitionCanFinalize";

interface NewSignatureRequestRowProps {
  petition: NewSignatureRequestRow_PetitionFragment;
  user: NewSignatureRequestRow_UserFragment;
  onUpdateConfig: (data: SignatureConfigInput | null) => Promise<void>;
  onStart: (message: Maybe<string>, completePetition: boolean) => void;
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
  const reviewBeforeSigning = petition.signatureConfig?.review ?? false;
  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();

  const startSignature = reviewBeforeSigning || petition.status === "COMPLETED";

  const { canFinalize } = usePetitionCanFinalize(petition);

  const handleStartSignature = async () => {
    try {
      const {
        signers: signersInfo,
        message,
        allowAdditionalSigners: allowMoreSigners,
      } = await showConfirmPetitionSignersDialog({
        user,
        accesses: petition.accesses,
        signatureConfig: petition.signatureConfig!,
        isUpdate: !startSignature && !canFinalize,
        previousSignatures: petition.signatureRequests,
      });

      await onUpdateConfig({
        ...omit(petition.signatureConfig!, ["integration", "signers", "__typename"]),
        timezone: petition.signatureConfig!.timezone,
        orgIntegrationId: petition.signatureConfig!.integration!.id,
        allowAdditionalSigners: allowMoreSigners,
        signersInfo,
      });

      const completePetition = !reviewBeforeSigning && canFinalize;

      if (startSignature || completePetition) {
        onStart(message, completePetition);
      }
    } catch {}
  };

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
          {startSignature ? (
            <FormattedMessage
              id="component.petition-signatures-card.start"
              defaultMessage="Start..."
            />
          ) : canFinalize ? (
            <FormattedMessage
              id="component.petition-signatures-card.finalize-and-sign"
              defaultMessage="Finalize and sign"
            />
          ) : (
            <FormattedMessage
              id="component.petition-signatures-card.edit-signers"
              defaultMessage="Edit signers"
            />
          )}
        </Button>
      </GridItem>
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
        integration {
          id
          name
          provider
        }
        review
        timezone
        title
        ...ConfirmPetitionSignersDialog_SignatureConfig
      }
      accesses {
        ...ConfirmPetitionSignersDialog_PetitionAccess
      }
      signatureRequests {
        ...ConfirmPetitionSignersDialog_PetitionSignatureRequest
      }
      ...usePetitionCanFinalize_PetitionBase
    }
    ${SignerReference.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.PetitionAccess}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSignatureRequest}
    ${ConfirmPetitionSignersDialog.fragments.SignatureConfig}
    ${usePetitionCanFinalize.fragments.PetitionBase}
  `,
};
