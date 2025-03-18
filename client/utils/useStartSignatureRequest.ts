import { gql, useMutation } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import {
  ConfirmPetitionSignersDialog,
  useConfirmPetitionSignersDialog,
} from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import { useHandledTestSignatureDialog } from "@parallel/components/petition-compose/dialogs/TestSignatureDialog";
import {
  useStartSignatureRequest_PetitionFragment,
  useStartSignatureRequest_UserFragment,
  useStartSignatureRequest_completePetitionDocument,
  useStartSignatureRequest_startSignatureRequestDocument,
  useStartSignatureRequest_updateSignatureConfigDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { omit } from "remeda";
import { isApolloError } from "./apollo/isApolloError";
import { useGoToPetitionSection } from "./goToPetition";
import { withError } from "./promises/withError";
import { Maybe, MaybePromise } from "./types";

import { usePetitionCanFinalize } from "./usePetitionCanFinalize";
import { usePetitionLimitReachedErrorDialog } from "./usePetitionLimitReachedErrorDialog";

interface UseStartSignatureRequestProps {
  user: useStartSignatureRequest_UserFragment;
  petition: useStartSignatureRequest_PetitionFragment;
  onRefetch?: () => MaybePromise<void>;
  options?: { redirect: boolean };
}

export function useStartSignatureRequest({
  user,
  petition,
  onRefetch,
  options = { redirect: true },
}: UseStartSignatureRequestProps) {
  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();
  const showPetitionLimitReachedErrorDialog = usePetitionLimitReachedErrorDialog();

  const reviewBeforeSigning =
    !!petition.signatureConfig?.isEnabled && petition.signatureConfig.review;
  const startSignature = reviewBeforeSigning || petition.status === "COMPLETED";
  const { canFinalize } = usePetitionCanFinalize(petition);

  const [updateSignatureConfig] = useMutation(
    useStartSignatureRequest_updateSignatureConfigDocument,
  );

  const [startSignatureRequest] = useMutation(
    useStartSignatureRequest_startSignatureRequestDocument,
  );

  const [completePetition] = useMutation(useStartSignatureRequest_completePetitionDocument);

  const toast = useToast();
  const intl = useIntl();
  const goToSection = useGoToPetitionSection();
  const showTestSignatureDialog = useHandledTestSignatureDialog();

  const handleStartSignatureProcess = useCallback(
    async (
      message: Maybe<string>,
      complete: boolean,
      customDocumentTemporaryFileId: Maybe<string>,
    ) => {
      try {
        if (complete) {
          await completePetition({
            variables: {
              petitionId: petition.id,
              message,
            },
          });
        } else {
          await startSignatureRequest({
            variables: {
              petitionId: petition.id,
              message,
              customDocumentTemporaryFileId,
            },
          });
        }
      } catch (error) {
        if (isApolloError(error, "PETITION_SEND_LIMIT_REACHED")) {
          await withError(showPetitionLimitReachedErrorDialog());
        }
        throw error;
      }
    },
    [completePetition, startSignatureRequest, petition],
  );

  return {
    handleStartSignature: async () => {
      try {
        const {
          signers: signersInfo,
          message,
          allowAdditionalSigners: allowMoreSigners,
          customDocumentTemporaryFileId,
        } = await showConfirmPetitionSignersDialog({
          user,
          signatureConfig: petition.signatureConfig!,
          isUpdate: !startSignature && !canFinalize,
          petitionId: petition.id,
          isInteractionWithRecipientsEnabled: petition.isInteractionWithRecipientsEnabled,
        });

        await updateSignatureConfig({
          variables: {
            petitionId: petition.id,
            signatureConfig: {
              ...omit(petition.signatureConfig!, ["integration", "signers", "__typename"]),
              isEnabled: true,
              timezone: petition.signatureConfig!.timezone,
              orgIntegrationId: petition.signatureConfig!.integration!.id,
              allowAdditionalSigners: allowMoreSigners,
              signersInfo,
            },
          },
        });

        const completePetition = !reviewBeforeSigning && canFinalize;

        if (startSignature || completePetition) {
          await showTestSignatureDialog(
            petition.signatureConfig?.integration?.environment,
            petition.signatureConfig?.integration?.name,
          );

          await handleStartSignatureProcess(
            message,
            completePetition,
            customDocumentTemporaryFileId,
          );

          toast({
            isClosable: true,
            status: "success",
            title: intl.formatMessage({
              id: "component.use-start-signature-request.signature-sent-toast-title",
              defaultMessage: "eSignature sent",
            }),
            description: intl.formatMessage({
              id: "component.use-start-signature-request.signature-sent-toast-description",
              defaultMessage: "Your signature is on its way.",
            }),
          });

          await onRefetch?.();
          if (options.redirect) {
            setTimeout(() => {
              goToSection("replies");
            }, 500);
          }
        }
      } catch {}
    },
    buttonLabel: startSignature
      ? intl.formatMessage({
          id: "component.use-start-signature-request.start",
          defaultMessage: "Start signature",
        })
      : canFinalize
        ? intl.formatMessage({
            id: "component.use-start-signature-request.finalize-and-sign",
            defaultMessage: "Finalize and sign",
          })
        : intl.formatMessage({
            id: "component.use-start-signature-request.edit-signers",
            defaultMessage: "Edit signers",
          }),
  };
}

useStartSignatureRequest.fragments = {
  User: gql`
    fragment useStartSignatureRequest_User on User {
      id
      ...ConfirmPetitionSignersDialog_User
    }
    ${ConfirmPetitionSignersDialog.fragments.User}
  `,
  Petition: gql`
    fragment useStartSignatureRequest_Petition on Petition {
      id
      status
      isInteractionWithRecipientsEnabled
      signatureConfig {
        isEnabled
        timezone
        integration {
          id
          environment
          name
        }
        ...ConfirmPetitionSignersDialog_SignatureConfig
        review
        useCustomDocument
      }
      ...usePetitionCanFinalize_PetitionBase
    }
    ${ConfirmPetitionSignersDialog.fragments.SignatureConfig}
    ${usePetitionCanFinalize.fragments.PetitionBase}
  `,
};

const _mutations = [
  gql`
    mutation useStartSignatureRequest_updateSignatureConfig(
      $petitionId: GID!
      $signatureConfig: SignatureConfigInput
    ) {
      updatePetition(petitionId: $petitionId, data: { signatureConfig: $signatureConfig }) {
        ...useStartSignatureRequest_Petition
      }
    }
    ${useStartSignatureRequest.fragments.Petition}
  `,
  gql`
    mutation useStartSignatureRequest_completePetition($petitionId: GID!, $message: String) {
      completePetition(petitionId: $petitionId, message: $message) {
        ...useStartSignatureRequest_Petition
      }
    }
    ${useStartSignatureRequest.fragments.Petition}
  `,
  gql`
    mutation useStartSignatureRequest_startSignatureRequest(
      $petitionId: GID!
      $message: String
      $customDocumentTemporaryFileId: GID
    ) {
      startSignatureRequest(
        petitionId: $petitionId
        message: $message
        customDocumentTemporaryFileId: $customDocumentTemporaryFileId
      ) {
        id
        status
      }
    }
  `,
];
