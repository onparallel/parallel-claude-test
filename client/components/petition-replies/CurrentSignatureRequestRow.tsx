import { gql } from "@apollo/client";
import { Box, Button, GridItem, Heading, HStack, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { BellIcon, DocumentIcon, DownloadIcon } from "@parallel/chakra/icons";
import { CurrentSignatureRequestRow_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { useSignatureCancelledRequestErrorMessage } from "@parallel/utils/useSignatureCancelledRequestErrorMessage";
import { Fragment } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { ButtonWithMoreOptions } from "../common/ButtonWithMoreOptions";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NetDocumentsIconButton } from "../common/NetDocumentsLink";
import { ResponsiveButtonIcon } from "../common/ResponsiveButtonIcon";
import { SignerReference } from "../common/SignerReference";
import { useSignatureCancelledRequestErrorDialog } from "../petition-activity/dialogs/SignatureCancelledRequestErrorDialog";
import { useConfirmSendSignatureReminderDialog } from "./dialogs/ConfirmSendSignatureReminderDialog";
import { PetitionSignatureRequestSignerStatusIcon } from "./PetitionSignatureRequestSignerStatusIcon";
import { PetitionSignatureRequestStatusText } from "./PetitionSignatureRequestStatusText";

interface CurrentSignatureRequestRowProps {
  signatureRequest: CurrentSignatureRequestRow_PetitionSignatureRequestFragment;
  onCancel: (petitionSignatureRequestId: string) => void;
  onDownload: (petitionSignatureRequestId: string, downloadAuditTrail: boolean) => void;
  onSendReminder: (petitionSignatureRequestId: string) => void;
  isDisabled?: boolean;
}

export function CurrentSignatureRequestRow({
  signatureRequest,
  onCancel,
  onDownload,
  onSendReminder,
  isDisabled,
}: CurrentSignatureRequestRowProps) {
  const intl = useIntl();
  const status = signatureRequest.status;
  const signerStatus = signatureRequest.signerStatus;
  const isAwaitingSignature = status === "ENQUEUED" || status === "PROCESSED";

  // when everyone signed (or declined) the document, there is a time window where the request is still in "processing" status
  // because the signed documents are being generated. In this window it makes no sense to cancel the request or send reminders,
  // so we will show this actions only of there is at least one signer that didn't sign/decline the document
  const someSignerIsPending = signerStatus.some(
    (s) =>
      isNullish(s.signer.signWithEmbeddedImageFileUploadId) &&
      (s.status === "PENDING" || s.status === "NOT_STARTED"),
  );

  const showConfirmSendSignatureReminderDialog = useConfirmSendSignatureReminderDialog();
  async function handleConfirmSendSignatureReminders() {
    try {
      await showConfirmSendSignatureReminderDialog();
      onSendReminder(signatureRequest.id);
    } catch {}
  }

  const requestErrorMessage = useSignatureCancelledRequestErrorMessage();
  const showSignatureCancelledRequestErrorDialog = useSignatureCancelledRequestErrorDialog();
  async function handleSeeRequestErrorMessageClick(
    signature: CurrentSignatureRequestRow_PetitionSignatureRequestFragment,
  ) {
    try {
      await showSignatureCancelledRequestErrorDialog({
        message: requestErrorMessage({
          errorCode: signature.errorCode!,
          createdAt: signature.createdAt,
          extraErrorData: signature.extraErrorData,
        }),
        reason: signature.errorMessage!,
      });
    } catch {}
  }

  const { signingMode } = signatureRequest.signatureConfig;

  return (
    <>
      <GridItem padding={2} paddingStart={4}>
        <Heading size="xs" as="h4" paddingBottom={1}>
          <FormattedMessage
            id="component.petition-signatures-card.status"
            defaultMessage="Status"
          />
        </Heading>
        <PetitionSignatureRequestStatusText signature={signatureRequest} />
      </GridItem>
      <GridItem padding={2}>
        <Heading size="xs" as="h4" paddingBottom={1}>
          <FormattedMessage
            id="component.petition-signatures-card.signers"
            defaultMessage="Signers"
          />
        </Heading>
        <Box>
          {!signatureRequest.isAnonymized ? (
            <FormattedList
              value={signerStatus.map((sStatus, index) => (
                <Fragment key={index}>
                  <SignerReference signer={sStatus.signer} />
                  {isAwaitingSignature &&
                  !sStatus.signer.signWithEmbeddedImageFileUploadId &&
                  (signingMode === "PARALLEL" || index > 0 || sStatus.status !== "NOT_STARTED") ? (
                    <PetitionSignatureRequestSignerStatusIcon
                      signerStatus={sStatus}
                      signingMode={signatureRequest.signatureConfig.signingMode}
                      position="relative"
                      marginX={1}
                    />
                  ) : null}
                </Fragment>
              ))}
            />
          ) : (
            <Text textStyle="hint">
              <FormattedMessage id="generic.not-available" defaultMessage="Not available" />
            </Text>
          )}
        </Box>
      </GridItem>
      <GridItem padding={2} paddingEnd={4} marginStart="auto">
        {isAwaitingSignature && someSignerIsPending ? (
          <>
            <IconButtonWithTooltip
              marginEnd={2}
              icon={<BellIcon />}
              label={intl.formatMessage({
                id: "component.petition-signatures-card.send-reminder",
                defaultMessage: "Send reminder",
              })}
              onClick={handleConfirmSendSignatureReminders}
              isDisabled={isDisabled || status === "ENQUEUED"}
            />
            <Button
              width="24"
              colorScheme="red"
              onClick={() => onCancel(signatureRequest.id)}
              isDisabled={isDisabled}
            >
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          </>
        ) : status === "COMPLETED" ? (
          <HStack justifyContent="flex-end">
            {signatureRequest.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS ? (
              <NetDocumentsIconButton
                externalId={signatureRequest.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS}
                fontSize="xl"
              />
            ) : null}

            <ButtonWithMoreOptions
              colorScheme="primary"
              isDisabled={signatureRequest.isAnonymized}
              as={ResponsiveButtonIcon}
              icon={<DownloadIcon fontSize="lg" display="block" />}
              breakpoint="lg"
              label={intl.formatMessage({
                id: "component.petition-signatures-card.signed-document",
                defaultMessage: "Signed document",
              })}
              onClick={() => onDownload(signatureRequest.id, false)}
              options={
                <MenuList minWidth="fit-content">
                  <MenuItem
                    icon={<DocumentIcon boxSize={5} />}
                    onClick={() => onDownload(signatureRequest.id, true)}
                    isDisabled={isNullish(signatureRequest.auditTrailFilename)}
                  >
                    <FormattedMessage
                      id="component.petition-signatures-card.audit-trail"
                      defaultMessage="Audit trail"
                    />
                  </MenuItem>
                </MenuList>
              }
            />
          </HStack>
        ) : status === "CANCELLED" && isNonNullish(signatureRequest.errorMessage) ? (
          <Button size="sm" onClick={() => handleSeeRequestErrorMessageClick(signatureRequest)}>
            <FormattedMessage
              id="component.petition-signatures-card.more-info-button"
              defaultMessage="More information"
            />
          </Button>
        ) : null}
      </GridItem>
    </>
  );
}

CurrentSignatureRequestRow.fragments = {
  PetitionSignatureRequest: gql`
    fragment CurrentSignatureRequestRow_PetitionSignatureRequest on PetitionSignatureRequest {
      id
      status
      isAnonymized
      ...PetitionSignatureRequestStatusText_PetitionSignatureRequest
      signerStatus {
        signer {
          ...SignerReference_PetitionSigner
          signWithEmbeddedImageFileUploadId
        }
        ...PetitionSignatureRequestSignerStatusIcon_SignerStatus
      }
      signatureConfig {
        signingMode
      }
      metadata
      auditTrailFilename
      errorCode
      createdAt
      errorMessage
      extraErrorData
    }
    ${PetitionSignatureRequestStatusText.fragments.PetitionSignatureRequest}
    ${SignerReference.fragments.PetitionSigner}
    ${PetitionSignatureRequestSignerStatusIcon.fragments.SignerStatus}
  `,
};
