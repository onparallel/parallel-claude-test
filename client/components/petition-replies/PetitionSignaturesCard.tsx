import { gql, useMutation, useQuery } from "@apollo/client";
import { Box, Center, Grid, Text, useToast } from "@chakra-ui/react";
import { AddIcon, SignatureIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionSignaturesCard_PetitionFragment,
  PetitionSignaturesCard_UserFragment,
  PetitionSignaturesCard_cancelSignatureRequestDocument,
  PetitionSignaturesCard_petitionDocument,
  PetitionSignaturesCard_sendSignatureRequestRemindersDocument,
  PetitionSignaturesCard_signedPetitionDownloadLinkDocument,
  PetitionSignaturesCard_updatePetitionSignatureConfigDocument,
} from "@parallel/graphql/__types";
import { assertTypenameArray } from "@parallel/utils/apollo/typename";
import { getPetitionSignatureEnvironment } from "@parallel/utils/getPetitionSignatureEnvironment";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import { useCallback, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { Card, CardHeader } from "../common/Card";
import { HelpPopover } from "../common/HelpPopover";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { TestModeSignatureBadge } from "../petition-common/TestModeSignatureBadge";
import {
  SignatureConfigDialog,
  useSignatureConfigDialog,
} from "../petition-common/dialogs/SignatureConfigDialog";
import { CurrentSignatureRequestRow } from "./CurrentSignatureRequestRow";
import { NewSignatureRequestRow } from "./NewSignatureRequestRow";
import { OlderSignatureRequestRows } from "./OlderSignatureRequestRows";
import { useConfirmRestartSignatureRequestDialog } from "./dialogs/ConfirmRestartSignatureRequestDialog";

export interface PetitionSignaturesCardProps {
  petition: PetitionSignaturesCard_PetitionFragment;
  user: PetitionSignaturesCard_UserFragment;
  onRefetchPetition: () => void;
  isDisabled: boolean;
}

const fragments = {
  User: gql`
    fragment PetitionSignaturesCard_User on User {
      ...TestModeSignatureBadge_User
      ...NewSignatureRequestRow_User
      ...SignatureConfigDialog_User
      organization {
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
    ${TestModeSignatureBadge.fragments.User}
    ${NewSignatureRequestRow.fragments.User}
    ${SignatureConfigDialog.fragments.User}
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
      ...getPetitionSignatureEnvironment_Petition
    }
    ${SignatureConfigDialog.fragments.PetitionBase}
    ${NewSignatureRequestRow.fragments.Petition}
    ${CurrentSignatureRequestRow.fragments.PetitionSignatureRequest}
    ${OlderSignatureRequestRows.fragments.PetitionSignatureRequest}
    ${getPetitionSignatureEnvironment.fragments.Petition}
  `,
};

const _mutations = [
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
        cancelReason
      }
    }
  `,
  gql`
    mutation PetitionSignaturesCard_signedPetitionDownloadLink(
      $petitionSignatureRequestId: GID!
      $preview: Boolean
      $downloadAuditTrail: Boolean
    ) {
      signedPetitionDownloadLink(
        petitionSignatureRequestId: $petitionSignatureRequestId
        preview: $preview
        downloadAuditTrail: $downloadAuditTrail
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
  gql`
    mutation PetitionSignaturesCard_completePetition($petitionId: GID!, $message: String) {
      completePetition(petitionId: $petitionId, message: $message) {
        ...PetitionSignaturesCard_Petition
      }
    }
    ${fragments.Petition}
  `,
];

const _queries = [
  gql`
    query PetitionSignaturesCard_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...PetitionSignaturesCard_Petition
      }
    }
    ${fragments.Petition}
  `,
];

export const PetitionSignaturesCard = Object.assign(
  chakraForwardRef<"section", PetitionSignaturesCardProps>(function PetitionSignaturesCard(
    { petition, user, isDisabled, onRefetchPetition, ...props },
    ref,
  ) {
    usePetitionSignaturesCardPolling(petition);

    let current: Maybe<UnwrapArray<PetitionSignaturesCard_PetitionFragment["signatureRequests"]>> =
      petition.signatureRequests[0];
    const older = petition.signatureRequests.slice(1);
    const signatureIntegrations = user.organization.signatureIntegrations.items;
    const signatureEnvironment = getPetitionSignatureEnvironment(petition);
    /**
     * If the signature config is defined on the petition and the last request is finished,
     * we consider that a new signature will be needed.
     * So we move the current to the older requests to give space in the Card for a new request
     */
    if (
      petition.signatureConfig &&
      isDefined(current) &&
      ["COMPLETED", "CANCELLING", "CANCELLED"].includes(current.status)
    ) {
      older.unshift(current);
      current = null;
    }

    const intl = useIntl();
    const toast = useToast();

    const [cancelSignatureRequest] = useMutation(
      PetitionSignaturesCard_cancelSignatureRequestDocument,
    );
    const [updateSignatureConfig] = useMutation(
      PetitionSignaturesCard_updatePetitionSignatureConfigDocument,
    );
    const [downloadSignedDoc] = useMutation(
      PetitionSignaturesCard_signedPetitionDownloadLinkDocument,
    );
    const [sendSignatureRequestReminders] = useMutation(
      PetitionSignaturesCard_sendSignatureRequestRemindersDocument,
    );
    const handleCancelSignatureProcess = useCallback(
      async (petitionSignatureRequestId: string) => {
        try {
          await cancelSignatureRequest({
            variables: { petitionSignatureRequestId },
          });
        } catch {}
      },
      [cancelSignatureRequest],
    );

    const handleDownloadSignedDoc = useCallback(
      async (petitionSignatureRequestId: string, downloadAuditTrail: boolean) => {
        await withError(
          openNewWindow(async () => {
            const { data } = await downloadSignedDoc({
              variables: { petitionSignatureRequestId, downloadAuditTrail, preview: true },
            });
            const { url, result } = data!.signedPetitionDownloadLink;
            if (result !== "SUCCESS") {
              throw new Error();
            }
            return url!;
          }),
        );
      },
      [downloadSignedDoc],
    );
    const showSignatureConfigDialog = useSignatureConfigDialog();

    const showConfirmRestartSignature = useConfirmRestartSignatureRequestDialog();
    async function handleAddNewSignature() {
      assertTypenameArray(signatureIntegrations, "SignatureOrgIntegration");
      try {
        if (current?.status === "COMPLETED") {
          await showConfirmRestartSignature();
        }
        const signatureConfig = await showSignatureConfigDialog({
          user,
          petition,
          integrations: signatureIntegrations,
        });
        await updateSignatureConfig({
          variables: { petitionId: petition.id, signatureConfig },
        });
      } catch {}
    }

    const handleSendSignatureReminder = useCallback(
      async (petitionSignatureRequestId: string) => {
        try {
          await sendSignatureRequestReminders({ variables: { petitionSignatureRequestId } });
          toast({
            title: intl.formatMessage({
              id: "component.petition-signatures-card.reminder-sent-toast-title",
              defaultMessage: "Reminder sent",
            }),
            description: intl.formatMessage({
              id: "component.petition-signatures-card.reminder-sent-toast-description",
              defaultMessage: "We have sent a reminder to the pending signers",
            }),
            duration: 5000,
            isClosable: true,
            status: "success",
          });
        } catch {}
      },
      [sendSignatureRequestReminders],
    );

    return (
      <Card ref={ref} data-section="signature-card" {...props}>
        <CardHeader
          leftIcon={<SignatureIcon fontSize="20px" />}
          rightAction={
            !petition.signatureConfig ||
            current?.status === "COMPLETED" ||
            current?.status === "CANCELLED" ? (
              <IconButtonWithTooltip
                isDisabled={isDisabled}
                label={intl.formatMessage({
                  id: "component.petition-signatures-card.add-signature-label",
                  defaultMessage: "Add signature",
                })}
                size="sm"
                icon={<AddIcon />}
                onClick={handleAddNewSignature}
              />
            ) : null
          }
        >
          <FormattedMessage id="generic.e-signature" defaultMessage="eSignature" />
          <HelpPopover popoverWidth="2xs">
            <FormattedMessage
              id="component.petition-signatures-card.signature-description"
              defaultMessage="Generates a document and initiates an eSignature process, through one of our integrated providers."
            />
          </HelpPopover>
          {signatureEnvironment === "DEMO" ? (
            <Box display="inline-block" marginLeft={2}>
              <TestModeSignatureBadge hasPetitionSignature={user.hasPetitionSignature} />
            </Box>
          ) : null}
        </CardHeader>
        {current || older.length > 0 || petition.signatureConfig ? (
          <Grid templateColumns="auto 1fr auto" alignItems="center">
            {petition.signatureConfig && !current ? (
              <NewSignatureRequestRow
                user={user}
                petition={petition}
                onRefetch={onRefetchPetition}
                isDisabled={isDisabled}
              />
            ) : current ? (
              <CurrentSignatureRequestRow
                signatureRequest={current}
                onCancel={handleCancelSignatureProcess}
                onDownload={handleDownloadSignedDoc}
                onSendReminder={handleSendSignatureReminder}
                isDisabled={isDisabled}
              />
            ) : null}
            {older.length ? (
              <OlderSignatureRequestRows signatures={older} onDownload={handleDownloadSignedDoc} />
            ) : null}
          </Grid>
        ) : (
          <Center flexDirection="column" padding={4} textStyle="hint" textAlign="center">
            <Text>
              <FormattedMessage
                id="component.petition-signatures-card.no-signature-configured"
                defaultMessage="No signature has been configured for this parallel."
              />
            </Text>
          </Center>
        )}
      </Card>
    );
  }),
  { fragments },
);

const POLL_INTERVAL = 30_000;

function usePetitionSignaturesCardPolling(petition: PetitionSignaturesCard_PetitionFragment) {
  const current = petition.signatureRequests.at(0);
  const { startPolling, stopPolling } = useQuery(PetitionSignaturesCard_petitionDocument, {
    pollInterval: POLL_INTERVAL,
    variables: { petitionId: petition.id },
  });

  useEffect(() => {
    if (current && current.status !== "CANCELLED" && !isDefined(current.auditTrailFilename)) {
      startPolling(POLL_INTERVAL);
    } else if (
      (current?.status === "COMPLETED" && isDefined(current.auditTrailFilename)) ||
      current?.status === "CANCELLED"
    ) {
      stopPolling();
    }

    return stopPolling;
  }, [current?.status, current?.auditTrailFilename]);
}
