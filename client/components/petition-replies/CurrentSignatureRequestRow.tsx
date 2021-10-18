import { gql } from "@apollo/client";
import { Box, Button, Heading } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { CurrentSignatureRequestRow_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { Fragment } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SignerReference } from "../common/SignerReference";
import { useConfirmSendSignatureReminderDialog } from "./ConfirmSendSignatureReminderDialog";
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
  const isAwaitingSignature = ["ENQUEUED", "PROCESSING"].includes(status);
  const isSigned = status === "COMPLETED";

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
      <Box>
        <Heading size="xs" as="h4">
          <FormattedMessage
            id="component.petition-signatures-card.status"
            defaultMessage="Status"
          />
        </Heading>
        <PetitionSignatureRequestStatusText status={status} />
      </Box>
      <Box>
        <Heading size="xs" as="h4">
          <FormattedMessage
            id="component.petition-signatures-card.signers"
            defaultMessage="Signers"
          />
        </Heading>
        <Box>
          <FormattedList
            value={signerStatus.map(({ signer, status }, index) => (
              <Fragment key={index}>
                <SignerReference signer={signer} />
                {isAwaitingSignature ? (
                  <PetitionSignatureRequestSignerStatusIcon status={status} marginBottom={1} />
                ) : null}
              </Fragment>
            ))}
          />
        </Box>
      </Box>
      <Box>
        {isAwaitingSignature ? (
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
        ) : isSigned ? (
          <Button width="24" colorScheme="purple" onClick={() => onDownload(signatureRequest.id)}>
            <FormattedMessage id="generic.download" defaultMessage="Download" />
          </Button>
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
        status
      }
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};
