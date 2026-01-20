import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useSignatureConfigDialog } from "@parallel/components/petition-common/dialogs/SignatureConfigDialog";
import { useConfirmRestartSignatureRequestDialog } from "@parallel/components/petition-replies/dialogs/ConfirmRestartSignatureRequestDialog";
import {
  useAddNewSignature_PetitionFragment,
  useAddNewSignature_updatePetitionSignatureConfigDocument,
} from "@parallel/graphql/__types";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import { isNonNullish, pick } from "remeda";

interface useAddNewSignatureProps {
  petition: useAddNewSignature_PetitionFragment;
}

export function useAddNewSignature({ petition }: useAddNewSignatureProps) {
  let current: Maybe<UnwrapArray<useAddNewSignature_PetitionFragment["signatureRequests"]>> =
    petition.signatureRequests[0];
  if (
    petition.signatureConfig?.isEnabled &&
    isNonNullish(current) &&
    ["COMPLETED", "CANCELLING", "CANCELLED"].includes(current.status)
  ) {
    current = null;
  }

  const [updateSignatureConfig] = useMutation(
    useAddNewSignature_updatePetitionSignatureConfigDocument,
  );

  const showSignatureConfigDialog = useSignatureConfigDialog();
  const showConfirmRestartSignature = useConfirmRestartSignatureRequestDialog();
  return async () => {
    try {
      if (current?.status === "COMPLETED" && isNonNullish(petition.signatureConfig?.integration)) {
        await showConfirmRestartSignature();
        await updateSignatureConfig({
          variables: {
            petitionId: petition.id,
            signatureConfig: {
              isEnabled: true,
              orgIntegrationId: petition.signatureConfig.integration!.id,
              signersInfo: petition.signatureConfig.signers.map((s) =>
                pick(s!, [
                  "contactId",
                  "email",
                  "firstName",
                  "lastName",
                  "isPreset",
                  "signWithEmbeddedImageFileUploadId",
                ]),
              ),
              ...pick(petition.signatureConfig, [
                "allowAdditionalSigners",
                "minSigners",
                "review",
                "signingMode",
                "instructions",
                "title",
                "useCustomDocument",
                "reviewAfterApproval",
              ]),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          },
        });
      } else {
        const signatureConfig = await showSignatureConfigDialog({
          petitionId: petition.id,
        });
        await updateSignatureConfig({
          variables: { petitionId: petition.id, signatureConfig },
        });
      }
    } catch {}
  };
}

const _fragments = {
  Petition: gql`
    fragment useAddNewSignature_Petition on Petition {
      id
      signatureConfig {
        isEnabled
        allowAdditionalSigners
        minSigners
        review
        signingMode
        instructions
        title
        useCustomDocument
        reviewAfterApproval
        integration {
          id
        }
        signers {
          contactId
          email
          firstName
          lastName
          isPreset
          signWithEmbeddedImageFileUploadId
        }
      }
      signatureRequests {
        id
        status
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation useAddNewSignature_updatePetitionSignatureConfig(
      $petitionId: GID!
      $signatureConfig: SignatureConfigInput
    ) {
      updatePetition(petitionId: $petitionId, data: { signatureConfig: $signatureConfig }) {
        ... on Petition {
          ...useAddNewSignature_Petition
        }
      }
    }
  `,
];
