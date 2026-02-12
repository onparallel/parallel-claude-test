import { gql } from "@apollo/client";

import { CheckIcon, CloseIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { Stack, Text } from "@parallel/components/ui";
import {
  DatesList_SignerStatusFragment,
  PetitionSignatureRequestSignerStatusIcon_SignerStatusFragment,
  SignatureConfigSigningMode,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { DateTime } from "../common/DateTime";
import { SmallPopover } from "../common/SmallPopover";

function DatesList({
  sentAt,
  openedAt,
  signedAt,
  declinedAt,
  bouncedAt,
}: DatesList_SignerStatusFragment) {
  return (
    <Stack as="ul" paddingStart={4} gap={1}>
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
      {bouncedAt ? (
        <Text as="li" fontSize="sm">
          <FormattedMessage
            id="component.petition-signature-request.signer-status.dates.bounced-at"
            defaultMessage="Email bounced: {bouncedAt}"
            values={{ bouncedAt: <DateTime value={bouncedAt} format={FORMATS["L+LT"]} /> }}
          />
        </Text>
      ) : null}
    </Stack>
  );
}

const _fragments = {
  SignerStatus: gql`
    fragment DatesList_SignerStatus on PetitionSignatureRequestSignerStatus {
      sentAt
      openedAt
      signedAt
      declinedAt
      bouncedAt
    }
  `,
};

export const PetitionSignatureRequestSignerStatusIcon = chakraComponent<
  "svg",
  {
    signerStatus: PetitionSignatureRequestSignerStatusIcon_SignerStatusFragment;
    signingMode: SignatureConfigSigningMode;
  }
>(function PetitionSignatureRequestSignerStatusIcon({
  ref,
  signerStatus: { status, sentAt, openedAt, signedAt, declinedAt, bouncedAt },
  signingMode,
  ...props
}) {
  switch (status) {
    case "SIGNED":
      return (
        <SmallPopover
          isDisabled={!sentAt && !openedAt && !signedAt}
          content={<DatesList sentAt={sentAt} openedAt={openedAt} signedAt={signedAt} />}
          width="auto"
        >
          <CheckIcon ref={ref} color="green.500" {...(props as any)} />
        </SmallPopover>
      );

    case "BOUNCED":
    case "DECLINED":
      return (
        <SmallPopover
          isDisabled={!sentAt && !openedAt && !declinedAt && !bouncedAt}
          content={
            <DatesList
              sentAt={sentAt}
              openedAt={openedAt}
              declinedAt={declinedAt}
              bouncedAt={bouncedAt}
            />
          }
          width="auto"
        >
          <CloseIcon ref={ref} color="red.500" fontSize="12px" {...(props as any)} />
        </SmallPopover>
      );

    case "PENDING":
      return (
        <SmallPopover
          isDisabled={!sentAt && !openedAt}
          content={<DatesList sentAt={sentAt} openedAt={openedAt} />}
          width="auto"
        >
          <TimeIcon ref={ref} color="yellow.500" {...(props as any)} />
        </SmallPopover>
      );

    case "NOT_STARTED":
      if (signingMode === "SEQUENTIAL") {
        return (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.petition-signature-request-signer-status-icon.not-started"
                  defaultMessage="The signature will start once the previous signer has signed."
                />
              </Text>
            }
            width="auto"
          >
            <TimeIcon ref={ref} color="gray.500" {...(props as any)} />
          </SmallPopover>
        );
      } else {
        return null;
      }
    default:
      return null;
  }
});

const _fragmentsPetitionSignatureRequestSignerStatusIcon = {
  SignerStatus: gql`
    fragment PetitionSignatureRequestSignerStatusIcon_SignerStatus on PetitionSignatureRequestSignerStatus {
      status
      ...DatesList_SignerStatus
    }
  `,
};
