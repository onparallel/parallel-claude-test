import { gql } from "@apollo/client";
import { Box, Button, Heading, Stack } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { CurrentSignatureRequestRow_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { ContactLink } from "../common/ContactLink";
import { Divider } from "../common/Divider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
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
  const signers = signatureRequest.signerStatus;
  const isAwaitingSignature = ["ENQUEUED", "PROCESSING"].includes(status);
  const isSigned = status === "COMPLETED";

  const showConfirmSendSignatureReminderDialog = useConfirmSendSignatureReminderDialog();
  async function handleConfirmSendSignatureReminders() {
    const [, sendReminder] = await withError(
      showConfirmSendSignatureReminderDialog({
        pendingSignerNames: signers
          .filter((s) => s.status === "PENDING")
          .map((s) => s.contact.fullName ?? s.contact.email),
      })
    );

    if (sendReminder) {
      onSendReminder(signatureRequest.id);
    }
  }

  return (
    <>
      <Stack
        paddingX={4}
        paddingY={2}
        direction={{ base: "column", md: "row" }}
        alignItems="center"
        spacing={4}
      >
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
          <FormattedList
            value={signers.map(({ contact, status }, i) => [
              <>
                <ContactLink contact={contact} key={contact.id} />
                <PetitionSignatureRequestSignerStatusIcon status={status} />
              </>,
            ])}
          />
        </Box>
        <Stack flex="1" direction="row" justifyContent="flex-end">
          {isAwaitingSignature ? (
            <>
              <IconButtonWithTooltip
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
        </Stack>
      </Stack>
      <Divider />
    </>
  );
}

CurrentSignatureRequestRow.fragments = {
  PetitionSignatureRequest: gql`
    fragment CurrentSignatureRequestRow_PetitionSignatureRequest on PetitionSignatureRequest {
      id
      status
      signerStatus {
        contact {
          ...ContactLink_Contact
        }
        status
      }
    }
    ${ContactLink.fragments.Contact}
  `,
};
