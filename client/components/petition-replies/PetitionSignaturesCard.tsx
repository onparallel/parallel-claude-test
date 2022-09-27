import { gql, useMutation } from "@apollo/client";
import { Box, Center, Grid, Text, useToast } from "@chakra-ui/react";
import { AddIcon, SignatureIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionSignaturesCard_cancelSignatureRequestDocument,
  PetitionSignaturesCard_PetitionFragment,
  PetitionSignaturesCard_sendSignatureRequestRemindersDocument,
  PetitionSignaturesCard_signedPetitionDownloadLinkDocument,
  PetitionSignaturesCard_startSignatureRequestDocument,
  PetitionSignaturesCard_updatePetitionSignatureConfigDocument,
  PetitionSignaturesCard_UserFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { assertTypenameArray } from "@parallel/utils/apollo/typename";
import { getPetitionSignatureEnvironment } from "@parallel/utils/getPetitionSignatureEnvironment";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import { usePetitionLimitReachedErrorDialog } from "@parallel/utils/usePetitionLimitReachedErrorDialog";
import { usePetitionSignaturesCardPolling } from "@parallel/utils/usePetitionSignaturesCardPolling";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { HelpPopover } from "../common/HelpPopover";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SupportLink } from "../common/SupportLink";
import {
  SignatureConfigDialog,
  useSignatureConfigDialog,
} from "../petition-common/dialogs/SignatureConfigDialog";
import { TestModeSignatureBadge } from "../petition-common/TestModeSignatureBadge";
import { CurrentSignatureRequestRow } from "./CurrentSignatureRequestRow";
import { useConfirmRestartSignatureRequestDialog } from "./dialogs/ConfirmRestartSignatureRequestDialog";
import { NewSignatureRequestRow } from "./NewSignatureRequestRow";
import { OlderSignatureRequestRows } from "./OlderSignatureRequestRows";

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
    mutation PetitionSignaturesCard_startSignatureRequest($petitionId: GID!, $message: String) {
      startSignatureRequest(petitionId: $petitionId, message: $message) {
        id
        status
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
];

export const PetitionSignaturesCard = Object.assign(
  chakraForwardRef<"section", PetitionSignaturesCardProps>(function PetitionSignaturesCard(
    { petition, user, isDisabled, onRefetchPetition, ...props },
    ref
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
      (current?.status === "COMPLETED" || current?.status === "CANCELLED")
    ) {
      older.unshift(current);
      current = null;
    }

    const intl = useIntl();
    const toast = useToast();

    const [cancelSignatureRequest] = useMutation(
      PetitionSignaturesCard_cancelSignatureRequestDocument
    );
    const [startSignatureRequest] = useMutation(
      PetitionSignaturesCard_startSignatureRequestDocument
    );
    const [updateSignatureConfig] = useMutation(
      PetitionSignaturesCard_updatePetitionSignatureConfigDocument
    );
    const [downloadSignedDoc] = useMutation(
      PetitionSignaturesCard_signedPetitionDownloadLinkDocument
    );
    const [sendSignatureRequestReminders] = useMutation(
      PetitionSignaturesCard_sendSignatureRequestRemindersDocument
    );
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

    const showErrorDialog = useErrorDialog();
    const showPetitionLimitReachedErrorDialog = usePetitionLimitReachedErrorDialog();

    const handleStartSignatureProcess = useCallback(
      async (message?: Maybe<string>) => {
        try {
          await startSignatureRequest({
            variables: { petitionId: petition.id, message },
          });
          toast({
            isClosable: true,
            duration: 5000,
            title: intl.formatMessage({
              id: "component.petition-signatures-card.signature-sent-toast-title",
              defaultMessage: "eSignature sent",
            }),
            description: intl.formatMessage({
              id: "component.petition-signatures-card.signature-sent-toast-description",
              defaultMessage: "Your signature is on its way.",
            }),
            status: "success",
          });
          await onRefetchPetition();
        } catch (error: any) {
          if (isApolloError(error, "SIGNATURIT_SHARED_APIKEY_LIMIT_REACHED")) {
            await withError(
              showErrorDialog({
                message: intl.formatMessage(
                  {
                    id: "component.petition-signatures-card.no-credits-left.error",
                    defaultMessage:
                      "The eSignature could not be started due to lack of signature credits. Please <a>contact with support</a> to get more credits.",
                  },
                  {
                    a: (chunks: any) => (
                      <SupportLink
                        message={intl.formatMessage({
                          id: "component.petition-signatures-card.add-signature-credits-message",
                          defaultMessage:
                            "Hi, I would like to get more information about how to get more signature credits.",
                        })}
                      >
                        {chunks}
                      </SupportLink>
                    ),
                  }
                ),
              })
            );
          } else if (isApolloError(error, "PETITION_SEND_CREDITS_ERROR")) {
            await withError(showPetitionLimitReachedErrorDialog());
          }
        }
      },
      [startSignatureRequest, petition]
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
          })
        );
      },
      [downloadSignedDoc]
    );
    const showSignatureConfigDialog = useSignatureConfigDialog();

    const showConfirmRestartSignature = useConfirmRestartSignatureRequestDialog();
    async function handleAddNewSignature() {
      assertTypenameArray(signatureIntegrations, "SignatureOrgIntegration");
      try {
        if (current?.status === "COMPLETED") {
          await showConfirmRestartSignature({});
        }
        const signatureConfig = await showSignatureConfigDialog({
          user,
          petition,
          providers: signatureIntegrations,
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
                  id: "component.petition-signatures-card.add-signature.label",
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
              defaultMessage="Generates a document and iniciates an eSignature process, through one of our integrated providers."
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
                onStart={handleStartSignatureProcess}
                onUpdateConfig={handleUpdateSignatureConfig}
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
  { fragments, mutations }
);
