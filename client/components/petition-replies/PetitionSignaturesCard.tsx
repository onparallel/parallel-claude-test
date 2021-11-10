import { gql } from "@apollo/client";
import { Center, Grid, HStack, Text, useToast } from "@chakra-ui/react";
import { SignatureIcon, SignaturePlusIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  OrgIntegrationStatus,
  PetitionSignaturesCard_PetitionFragment,
  PetitionSignaturesCard_UserFragment,
  SignatureConfigInput,
  usePetitionSignaturesCard_cancelSignatureRequestMutation,
  usePetitionSignaturesCard_sendSignatureRequestRemindersMutation,
  usePetitionSignaturesCard_signedPetitionDownloadLinkMutation,
  usePetitionSignaturesCard_startSignatureRequestMutation,
  usePetitionSignaturesCard_updatePetitionSignatureConfigMutation,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Card, GenericCardHeader } from "../common/Card";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Link } from "../common/Link";
import {
  SignatureConfigDialog,
  useSignatureConfigDialog,
} from "../petition-common/SignatureConfigDialog";
import { TestModeSignatureBadge } from "../petition-common/TestModeSignatureBadge";
import { useConfirmRestartSignatureRequestDialog } from "./ConfirmRestartSignatureRequestDialog";
import { CurrentSignatureRequestRow } from "./CurrentSignatureRequestRow";
import { NewSignatureRequestRow } from "./NewSignatureRequestRow";
import { OlderSignatureRequestRows } from "./OlderSignatureRequestRows";

export interface PetitionSignaturesCardProps {
  petition: PetitionSignaturesCard_PetitionFragment;
  user: PetitionSignaturesCard_UserFragment;
  signatureEnvironment: OrgIntegrationStatus | undefined;
  onRefetchPetition: () => void;
}

const fragments = {
  User: gql`
    fragment PetitionSignaturesCard_User on User {
      ...TestModeSignatureBadge_User
      organization {
        signatureIntegrations: integrations(type: SIGNATURE, limit: 100) {
          items {
            ...SignatureConfigDialog_OrgIntegration
          }
        }
      }
    }
    ${SignatureConfigDialog.fragments.OrgIntegration}
    ${TestModeSignatureBadge.fragments.User}
  `,
  Petition: gql`
    fragment PetitionSignaturesCard_Petition on Petition {
      id
      status
      ...SignatureConfigDialog_PetitionBase
      ...NewSignatureRequestRow_Petition
      signatureRequests {
        ...CurrentSignatureRequestRow_PetitionSignatureRequest
        ...OlderSignatureRequestRows_PetitionSignatureRequest
      }
    }
    ${SignatureConfigDialog.fragments.PetitionBase}
    ${NewSignatureRequestRow.fragments.Petition}
    ${CurrentSignatureRequestRow.fragments.PetitionSignatureRequest}
    ${OlderSignatureRequestRows.fragments.PetitionSignatureRequest}
  `,
};
const mutations = [
  gql`
    mutation PetitionSignaturesCard_updatePetitionSignatureConfig(
      $petitionId: GID!
      $signatureConfig: SignatureConfigInput
    ) {
      updatePetition(petitionId: $petitionId, data: { signatureConfig: $signatureConfig }) {
        ... on Petition {
          ...PetitionSignaturesCard_Petition
        }
      }
    }
    ${fragments.Petition}
  `,
  gql`
    mutation PetitionSignaturesCard_cancelSignatureRequest($petitionSignatureRequestId: GID!) {
      cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionSignaturesCard_startSignatureRequest($petitionId: GID!) {
      startSignatureRequest(petitionId: $petitionId) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionSignaturesCard_signedPetitionDownloadLink(
      $petitionSignatureRequestId: GID!
      $preview: Boolean
    ) {
      signedPetitionDownloadLink(
        petitionSignatureRequestId: $petitionSignatureRequestId
        preview: $preview
      ) {
        result
        url
      }
    }
  `,
  gql`
    mutation PetitionSignaturesCard_sendSignatureRequestReminders(
      $petitionSignatureRequestId: GID!
    ) {
      sendSignatureRequestReminders(petitionSignatureRequestId: $petitionSignatureRequestId)
    }
  `,
];

export const PetitionSignaturesCard = Object.assign(
  chakraForwardRef<"section", PetitionSignaturesCardProps>(function PetitionSignaturesCard(
    { petition, user, signatureEnvironment, onRefetchPetition, ...props },
    ref
  ) {
    let current: Maybe<UnwrapArray<PetitionSignaturesCard_PetitionFragment["signatureRequests"]>> =
      petition.signatureRequests![0];
    const older = petition.signatureRequests!.slice(1);
    /**
     * If the signature config is defined on the petition and the last request is finished,
     * we consider that a new signature will be needed.
     * So we move the current to the older requests to give space in the Card for a new request
     */
    if (
      petition.signatureConfig &&
      (current?.status === "COMPLETED" || current?.status === "CANCELLED")
    ) {
      older.unshift(current);
      current = null;
    }

    const intl = useIntl();
    const toast = useToast();

    const [cancelSignatureRequest] = usePetitionSignaturesCard_cancelSignatureRequestMutation();
    const [startSignatureRequest] = usePetitionSignaturesCard_startSignatureRequestMutation();
    const [updateSignatureConfig] =
      usePetitionSignaturesCard_updatePetitionSignatureConfigMutation();
    const [downloadSignedDoc] = usePetitionSignaturesCard_signedPetitionDownloadLinkMutation();
    const [sendSignatureRequestReminders] =
      usePetitionSignaturesCard_sendSignatureRequestRemindersMutation();
    const handleCancelSignatureProcess = useCallback(
      async (petitionSignatureRequestId: string) => {
        await updateSignatureConfig({
          variables: { petitionId: petition.id, signatureConfig: null },
        });
        await cancelSignatureRequest({
          variables: { petitionSignatureRequestId },
        });
      },
      [updateSignatureConfig, cancelSignatureRequest]
    );

    const handleStartSignatureProcess = useCallback(async () => {
      await startSignatureRequest({
        variables: { petitionId: petition.id },
      });
      await onRefetchPetition();
    }, [startSignatureRequest, petition]);

    const handleDownloadSignedDoc = useCallback(
      (petitionSignatureRequestId: string) => {
        openNewWindow(async () => {
          const { data } = await downloadSignedDoc({
            variables: { petitionSignatureRequestId, preview: true },
          });
          const { url, result } = data!.signedPetitionDownloadLink;
          if (result !== "SUCCESS") {
            throw new Error();
          }
          return url!;
        });
      },
      [downloadSignedDoc]
    );
    const showSignatureConfigDialog = useSignatureConfigDialog();

    const showConfirmRestartSignature = useConfirmRestartSignatureRequestDialog();
    async function handleAddNewSignature() {
      try {
        if (current?.status === "COMPLETED") {
          await showConfirmRestartSignature({});
        }
        const signatureConfig = await showSignatureConfigDialog({
          petition,
          providers: user.organization.signatureIntegrations.items,
        });
        await updateSignatureConfig({
          variables: { petitionId: petition.id, signatureConfig },
        });

        if (["COMPLETED", "CLOSED"].includes(petition.status)) {
          await handleStartSignatureProcess();
        }
      } catch {}
    }

    async function handleUpdateSignatureConfig(signatureConfig: SignatureConfigInput | null) {
      await updateSignatureConfig({
        variables: { petitionId: petition.id, signatureConfig },
      });
    }

    const handleSendSignatureReminder = useCallback(
      async (petitionSignatureRequestId: string) => {
        try {
          await sendSignatureRequestReminders({ variables: { petitionSignatureRequestId } });
          toast({
            title: intl.formatMessage({
              id: "component.petition-signatures-card.reminder-sent.toast-title",
              defaultMessage: "Reminder sent",
            }),
            description: intl.formatMessage({
              id: "component.petition-signatures-card.reminder-sent.toast-description",
              defaultMessage: "We have sent a reminder to the pending signers",
            }),
            duration: 5000,
            isClosable: true,
            status: "success",
          });
        } catch {}
      },
      [sendSignatureRequestReminders]
    );

    return (
      <Card ref={ref} {...props}>
        <GenericCardHeader
          rightAction={
            !petition.signatureConfig ||
            current?.status === "COMPLETED" ||
            current?.status === "CANCELLED" ? (
              <IconButtonWithTooltip
                label={intl.formatMessage({
                  id: "component.petition-signatures-card.add-signature.label",
                  defaultMessage: "Add signature",
                })}
                size="sm"
                icon={<SignaturePlusIcon fontSize="20px" />}
                onClick={handleAddNewSignature}
                borderColor="gray.300"
                borderWidth="1px"
                backgroundColor="white"
              />
            ) : null
          }
        >
          <HStack as="span" gridGap={2}>
            <SignatureIcon fontSize="20px" />
            <FormattedMessage
              id="component.petition-signatures-card.header"
              defaultMessage="Petition eSignature"
            />
            {signatureEnvironment === "DEMO" ? (
              <TestModeSignatureBadge hasPetitionSignature={user.hasPetitionSignature} />
            ) : null}
          </HStack>
        </GenericCardHeader>
        {current || older.length > 0 || petition.signatureConfig ? (
          <Grid
            paddingX={4}
            paddingY={2}
            gap={4}
            templateColumns="auto 1fr auto"
            alignItems="center"
          >
            {petition.signatureConfig && !current ? (
              <NewSignatureRequestRow
                petition={petition}
                onStart={handleStartSignatureProcess}
                onUpdateConfig={handleUpdateSignatureConfig}
              />
            ) : current ? (
              <CurrentSignatureRequestRow
                signatureRequest={current}
                onCancel={handleCancelSignatureProcess}
                onDownload={handleDownloadSignedDoc}
                onSendReminder={handleSendSignatureReminder}
              />
            ) : null}
            {older.length ? (
              <OlderSignatureRequestRows signatures={older} onDownload={handleDownloadSignedDoc} />
            ) : null}
          </Grid>
        ) : (
          <Center flexDirection="column" minHeight={24} textStyle="hint" textAlign="center">
            <Text>
              <FormattedMessage
                id="component.petition-signatures-card.no-signature-configured"
                defaultMessage="No signature has been configured for this petition."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.petition-signatures-card.no-signature-configured-2"
                defaultMessage="If you need it, you can configure it from the petition settings in the <a>Compose</a> tab."
                values={{
                  a: (chunks: any) => (
                    <Link href={`/app/petitions/${petition.id}/compose`}>{chunks}</Link>
                  ),
                }}
              />
            </Text>
          </Center>
        )}
      </Card>
    );
  }),
  { fragments, mutations }
);
