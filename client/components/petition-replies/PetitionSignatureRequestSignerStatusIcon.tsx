import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionSignatureRequestSignerStatusIcon_SignerStatusFragment,
  DatesList_SignerStatusFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { DateTime } from "../common/DateTime";
import { SmallPopover } from "../common/SmallPopover";

function DatesList({ sentAt, openedAt, signedAt, declinedAt }: DatesList_SignerStatusFragment) {
  return (
    <Stack as="ul" paddingLeft={4} spacing={1}>
      {sentAt ? (
        <Text as="li" fontSize="sm">
          <FormattedMessage
            id="component.petition-signature-request.signer-status.dates.sent-at"
            defaultMessage="Signature sent: {sentAt}"
            values={{ sentAt: <DateTime value={sentAt} format={FORMATS["L+LT"]} /> }}
          />
        </Text>
      ) : null}
      {openedAt ? (
        <Text as="li" fontSize="sm">
          <FormattedMessage
            id="component.petition-signature-request.signer-status.dates.opened-at"
            defaultMessage="Document opened: {openedAt}"
            values={{ openedAt: <DateTime value={openedAt} format={FORMATS["L+LT"]} /> }}
          />
        </Text>
      ) : null}
      {signedAt ? (
        <Text as="li" fontSize="sm">
          <FormattedMessage
            id="component.petition-signature-request.signer-status.dates.signed-at"
            defaultMessage="Signature completed: {signedAt}"
            values={{ signedAt: <DateTime value={signedAt} format={FORMATS["L+LT"]} /> }}
          />
        </Text>
      ) : null}
      {declinedAt ? (
        <Text as="li" fontSize="sm">
          <FormattedMessage
            id="component.petition-signature-request.signer-status.dates.declined-at"
            defaultMessage="Document declined: {declinedAt}"
            values={{ declinedAt: <DateTime value={declinedAt} format={FORMATS["L+LT"]} /> }}
          />
        </Text>
      ) : null}
    </Stack>
  );
}

DatesList.fragments = {
  SignerStatus: gql`
    fragment DatesList_SignerStatus on PetitionSignatureRequestSignerStatus {
      sentAt
      openedAt
      signedAt
      declinedAt
    }
  `,
};

export const PetitionSignatureRequestSignerStatusIcon = Object.assign(
  chakraForwardRef<
    "svg",
    { signerStatus: PetitionSignatureRequestSignerStatusIcon_SignerStatusFragment }
  >(function PetitionSignatureRequestSignerStatusIcon(
    { signerStatus: { status, sentAt, openedAt, signedAt, declinedAt }, ...props },
    ref
  ) {
    switch (status) {
      case "SIGNED":
        return (
          <SmallPopover
            isDisabled={!sentAt && !openedAt && !signedAt}
            content={<DatesList sentAt={sentAt} openedAt={openedAt} signedAt={signedAt} />}
            width="auto"
          >
            <CheckIcon ref={ref} color="green.500" {...props} />
          </SmallPopover>
        );
      case "DECLINED":
        return (
          <SmallPopover
            isDisabled={!sentAt && !openedAt && !declinedAt}
            content={<DatesList sentAt={sentAt} openedAt={openedAt} declinedAt={declinedAt} />}
            width="auto"
          >
            <CloseIcon ref={ref} color="red.500" fontSize="12px" {...props} />
          </SmallPopover>
        );
      case "PENDING":
        return (
          <SmallPopover
            isDisabled={!sentAt && !openedAt}
            content={<DatesList sentAt={sentAt} openedAt={openedAt} />}
            width="auto"
          >
            <TimeIcon ref={ref} color="yellow.500" {...props} />
          </SmallPopover>
        );
      default:
        return null;
    }
  }),
  {
    fragments: {
      SignerStatus: gql`
        fragment PetitionSignatureRequestSignerStatusIcon_SignerStatus on PetitionSignatureRequestSignerStatus {
          status
          ...DatesList_SignerStatus
        }
        ${DatesList.fragments.SignerStatus}
      `,
    },
  }
);
