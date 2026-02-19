import { gql } from "@apollo/client";
import { Badge } from "@chakra-ui/react";
import { CircleCheckFilledIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, HStack, Stack, Text } from "@parallel/components/ui";
import { RecipientViewSignatureStatusDialog_PublicPetitionFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

function SignatureStatusDialog({
  petition,
  ...props
}: DialogProps<{ petition: RecipientViewSignatureStatusDialog_PublicPetitionFragment }>) {
  const signers = petition.latestSignatureRequest?.signerStatus ?? [];
  const isSequential = petition.signatureConfig?.signingMode === "SEQUENTIAL";
  return (
    <ConfirmDialog
      hasCloseButton
      size="xl"
      header={
        <HStack>
          <CircleCheckFilledIcon color="green.500" />
          <FormattedMessage
            id="component.signature-status-dialog.header"
            defaultMessage="Signature started"
          />
        </HStack>
      }
      body={
        <Stack>
          <Text>
            {isSequential ? (
              <FormattedMessage
                id="component.signature-status-dialog.body-sequential"
                defaultMessage="We have sent the document to the first contact, the rest will receive the signature after the one before has signed."
              />
            ) : (
              <FormattedMessage
                id="component.signature-status-dialog.body"
                defaultMessage="We have sent the document to these signers."
              />
            )}
          </Text>
          <Stack as="ul" gap={1} paddingStart={4}>
            {signers.map((signer, i) => (
              <Text as="li" key={i}>
                {signer.signer.fullName} {`<${signer.signer.email}>`}{" "}
                <SignatureStatusBadge status={signer.status} />
              </Text>
            ))}
          </Stack>
        </Stack>
      }
      confirm={
        <Button onClick={() => props.onResolve()} colorPalette="primary" variant="solid">
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

export function useSignatureStatusDialog() {
  return useDialog(SignatureStatusDialog);
}

const _fragments = {
  PublicPetition: gql`
    fragment RecipientViewSignatureStatusDialog_PublicPetition on PublicPetition {
      id
      signatureConfig {
        signingMode
      }
      latestSignatureRequest {
        id
        signerStatus {
          signer {
            fullName
            email
          }
          status
        }
      }
    }
  `,
};

function SignatureStatusBadge({ status }: { status: string }) {
  if (status === "SIGNED") {
    return (
      <Badge colorScheme="green">
        <FormattedMessage id="component.signature-status-badge.signed" defaultMessage="Signed" />
      </Badge>
    );
  } else if (status === "DECLINED") {
    return (
      <Badge colorScheme="red">
        <FormattedMessage
          id="component.signature-status-badge.canceled"
          defaultMessage="Canceled"
        />
      </Badge>
    );
  } else if (status === "BOUNCED") {
    return (
      <Badge colorScheme="red">
        <FormattedMessage id="component.signature-status-badge.bounced" defaultMessage="Bounced" />
      </Badge>
    );
  } else if (status === "PENDING") {
    return (
      <Badge colorScheme="yellow">
        <FormattedMessage
          id="component.signature-status-badge.pending"
          defaultMessage="Pending signature"
        />
      </Badge>
    );
  } else if (status === "NOT_STARTED") {
    return (
      <Badge colorScheme="gray">
        <FormattedMessage
          id="component.signature-status-badge.not-started"
          defaultMessage="Not started"
        />
      </Badge>
    );
  }
  return null;
}
