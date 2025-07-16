import { gql, useMutation } from "@apollo/client";
import {
  SignatureConfigDialog,
  useSignatureConfigDialog,
} from "@parallel/components/petition-common/dialogs/SignatureConfigDialog";
import { useConfirmRestartSignatureRequestDialog } from "@parallel/components/petition-replies/dialogs/ConfirmRestartSignatureRequestDialog";
import {
  useAddNewSignature_PetitionFragment,
  useAddNewSignature_updatePetitionSignatureConfigDocument,
  useAddNewSignature_UserFragment,
} from "@parallel/graphql/__types";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import { isNonNullish, pick } from "remeda";
import { assertTypenameArray } from "./apollo/typename";

interface useAddNewSignatureProps {
  user: useAddNewSignature_UserFragment;
  petition: useAddNewSignature_PetitionFragment;
}

export function useAddNewSignature({ user, petition }: useAddNewSignatureProps) {
  let current: Maybe<UnwrapArray<useAddNewSignature_PetitionFragment["signatureRequests"]>> =
    petition.signatureRequests[0];
  const signatureIntegrations = user.organization.signatureIntegrations.items;
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
    assertTypenameArray(signatureIntegrations, "SignatureOrgIntegration");
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
          user,
          petition,
          integrations: signatureIntegrations,
        });
        await updateSignatureConfig({
          variables: { petitionId: petition.id, signatureConfig },
        });
      }
    } catch {}
  };
}

useAddNewSignature.fragments = {
  User: gql`
    fragment useAddNewSignature_User on User {
      id
      ...SignatureConfigDialog_User
      organization {
        id
        signatureIntegrations: integrations(type: SIGNATURE, limit: 100) {
          items {
            ... on SignatureOrgIntegration {
              ...SignatureConfigDialog_SignatureOrgIntegration
            }
          }
        }
      }
    }
    ${SignatureConfigDialog.fragments.SignatureOrgIntegration}
    ${SignatureConfigDialog.fragments.User}
  `,
  Petition: gql`
    fragment useAddNewSignature_Petition on Petition {
      id
      ...SignatureConfigDialog_PetitionBase
      signatureConfig {
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
    ${SignatureConfigDialog.fragments.PetitionBase}
    ${SignatureConfigDialog.fragments.SignatureConfig}
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
    ${useAddNewSignature.fragments.Petition}
  `,
];
