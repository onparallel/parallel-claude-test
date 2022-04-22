import { gql } from "@apollo/client";
import { Box, Button, Heading, HStack } from "@chakra-ui/react";
import { BellIcon, NetDocumentsIcon } from "@parallel/chakra/icons";
import { CurrentSignatureRequestRow_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { Fragment } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SignerReference } from "../common/SignerReference";
import { useConfirmSendSignatureReminderDialog } from "./dialogs/ConfirmSendSignatureReminderDialog";
import { PetitionSignatureRequestSignerStatusIcon } from "./PetitionSignatureRequestSignerStatusIcon";
import { PetitionSignatureRequestStatusText } from "./PetitionSignatureRequestStatusText";

interface CurrentSignatureRequestRowProps {
  signatureRequest: CurrentSignatureRequestRow_PetitionSignatureRequestFragment;
  onCancel: (petitionSignatureRequestId: string) => void;
  onDownload: (petitionSignatureRequestId: string) => void;
  onSendReminder: (petitionSignatureRequestId: string) => void;
}

export function CurrentSignatureRequestRow({
  signatureRequest,
  onCancel,
  onDownload,
  onSendReminder,
}: CurrentSignatureRequestRowProps) {
  const intl = useIntl();
  const status = signatureRequest.status;
  const signerStatus = signatureRequest.signerStatus;
  const isAwaitingSignature = ["ENQUEUED", "PROCESSING", "PROCESSED"].includes(status);

  // when everyone signed (or declined) the document, there is a time window where the request is still in "processing" status
  // because the signed documents are being generated. In this window it makes no sense to cancel the request or send reminders,
  // so we will show this actions only of there is at least one signer that didn't sign/decline the document
  const someSignerIsPending = signerStatus.some((s) => s.status === "PENDING");

  const showConfirmSendSignatureReminderDialog = useConfirmSendSignatureReminderDialog();
  async function handleConfirmSendSignatureReminders() {
    const [, sendReminder] = await withError(
      showConfirmSendSignatureReminderDialog({
        pendingSigners: signerStatus
          .filter(({ status }) => status === "PENDING")
          .map(({ signer }) => signer),
      })
    );

    if (sendReminder) {
      onSendReminder(signatureRequest.id);
    }
  }

  return (
    <>
      <Box padding={2} paddingLeft={4}>
        <Heading size="xs" as="h4">
          <FormattedMessage
            id="component.petition-signatures-card.status"
            defaultMessage="Status"
          />
        </Heading>
        <PetitionSignatureRequestStatusText status={status} />
      </Box>
      <Box padding={2}>
        <Heading size="xs" as="h4">
          <FormattedMessage
            id="component.petition-signatures-card.signers"
            defaultMessage="Signers"
          />
        </Heading>
        <Box>
          <FormattedList
            value={signerStatus.map((sStatus, index) => (
              <Fragment key={index}>
                <SignerReference signer={sStatus.signer} />
                {isAwaitingSignature ? (
                  <PetitionSignatureRequestSignerStatusIcon
                    signerStatus={sStatus}
                    position="relative"
                    top={-0.5}
                    marginX={0.5}
                  />
                ) : null}
              </Fragment>
            ))}
          />
        </Box>
      </Box>
      <Box padding={2} paddingRight={4}>
        {status === "PROCESSED" && someSignerIsPending ? (
          <>
            <IconButtonWithTooltip
              marginRight={2}
              icon={<BellIcon />}
              label={intl.formatMessage({
                id: "component.petition-signatures-card.send-reminder",
                defaultMessage: "Send reminder",
              })}
              onClick={handleConfirmSendSignatureReminders}
            />
            <Button width="24" colorScheme="red" onClick={() => onCancel(signatureRequest.id)}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          </>
        ) : status === "COMPLETED" ? (
          <HStack>
            {signatureRequest.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS ? (
              <IconButtonWithTooltip
                as="a"
                href={`https://eu.netdocuments.com/neWeb2/goid.aspx?id=${signatureRequest.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS}`}
                target="_href"
                icon={<NetDocumentsIcon fontSize="xl" />}
                label={intl.formatMessage({
                  id: "component.petition-signatures-card.access-file-nd",
                  defaultMessage: "Access file in NetDocuments",
                })}
              />
            ) : null}
            <Button width="24" colorScheme="purple" onClick={() => onDownload(signatureRequest.id)}>
              <FormattedMessage id="generic.download" defaultMessage="Download" />
            </Button>
          </HStack>
        ) : null}
      </Box>
    </>
  );
}

CurrentSignatureRequestRow.fragments = {
  PetitionSignatureRequest: gql`
    fragment CurrentSignatureRequestRow_PetitionSignatureRequest on PetitionSignatureRequest {
      id
      status
      signerStatus {
        signer {
          ...SignerReference_PetitionSigner
        }
        ...PetitionSignatureRequestSignerStatusIcon_SignerStatus
      }
      metadata
    }
    ${SignerReference.fragments.PetitionSigner}
    ${PetitionSignatureRequestSignerStatusIcon.fragments.SignerStatus}
  `,
};
