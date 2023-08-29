import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Badge,
  Button,
  Flex,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CircleCheckFilledIcon } from "@parallel/chakra/icons";
import {
  RecipientViewSignatureSentAlert_PublicPetitionFragment,
  Tone,
} from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { CloseableAlert } from "../common/CloseableAlert";
import { ContactListPopover } from "../common/ContactListPopover";
import { ConfirmDialog } from "../common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../common/dialogs/DialogProvider";

interface RecipientViewSignatureSentAlertProps {
  petition: RecipientViewSignatureSentAlert_PublicPetitionFragment;
  tone: Tone;
  onRefetch?: () => Promise<RecipientViewSignatureSentAlert_PublicPetitionFragment>;
}

export function RecipientViewSignatureSentAlert({
  petition,
  tone,
  onRefetch,
}: RecipientViewSignatureSentAlertProps) {
  const signers = petition.signatureConfig?.signers ?? [];
  const totalSigners = signers.concat(petition.signatureConfig?.additionalSigners ?? []);

  const showSignatureStatusDialog = useSignatureStatusDialog();
  async function handleCheckStatusClick() {
    const petition = await onRefetch?.();
    await withError(showSignatureStatusDialog({ petition: petition! }));
  }

  const isPendingStart =
    petition.signatureConfig?.review === true && !isDefined(petition.latestSignatureRequest);
  return (
    <CloseableAlert status={isPendingStart ? "warning" : "success"} zIndex={2}>
      <Flex
        maxWidth="container.lg"
        alignItems="center"
        justifyContent="flex-start"
        marginX="auto"
        width="100%"
        paddingLeft={4}
      >
        <AlertIcon color={isPendingStart ? "yellow.400" : undefined} />
        <AlertDescription>
          {isPendingStart ? (
            <Text>
              <FormattedMessage
                id="component.recipient-view-signature-sent-alert.petition-requires-signature-alert-1"
                defaultMessage="<b>eSignature pending</b>, we will send the document to sign after the information is reviewed."
                values={{ tone }}
              />
            </Text>
          ) : (
            <Text>
              <FormattedMessage
                id="component.recipient-view-signature-sent-alert.petition-signature-request-sent-alert"
                defaultMessage="<b>Document sent for signature</b> to {name} ({email}) {count, plural, =0{} other{and <a># more</a>}}."
                values={{
                  a: (chunks: any) => (
                    <ContactListPopover contacts={totalSigners.slice(1)}>
                      <Text
                        display="initial"
                        textDecoration="underline"
                        color="primary.600"
                        cursor="pointer"
                        as="span"
                      >
                        {chunks}
                      </Text>
                    </ContactListPopover>
                  ),
                  name: totalSigners[0]!.fullName,
                  email: totalSigners[0]!.email,
                  count: totalSigners.length - 1,
                }}
              />
            </Text>
          )}
          <Text>
            <FormattedMessage
              id="component.recipient-view-signature-sent-alert.petition-completed-alert-2"
              defaultMessage="If you make any changes, don't forget to hit the <b>Finalize</b> button again."
              values={{ tone }}
            />
          </Text>
        </AlertDescription>
        {petition.latestSignatureRequest && !isPendingStart && (
          <Button marginLeft="auto" onClick={handleCheckStatusClick} background="white">
            <FormattedMessage
              id="component.recipient-view-signature-sent-alert.check-status-button"
              defaultMessage="Check status"
            />
          </Button>
        )}
      </Flex>
    </CloseableAlert>
  );
}

RecipientViewSignatureSentAlert.fragments = {
  PublicPetition: gql`
    fragment RecipientViewSignatureSentAlert_PublicPetition on PublicPetition {
      latestSignatureRequest {
        status
        signerStatus {
          signer {
            fullName
            email
          }
          status
        }
      }
      signatureConfig {
        review
        signers {
          fullName
          email
        }
        additionalSigners {
          fullName
          email
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
  }
  return null;
}

function SignatureStatusDialog({
  petition,
  ...props
}: DialogProps<{ petition: RecipientViewSignatureSentAlert_PublicPetitionFragment }>) {
  const signers = petition.latestSignatureRequest?.signerStatus ?? [];
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
          <FormattedMessage
            id="component.signature-status-dialog.body"
            defaultMessage="We have sent the document to these signers."
          />
          <Stack as="ul" spacing={1} paddingLeft={4}>
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
        <Button onClick={() => props.onResolve()} colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

function useSignatureStatusDialog() {
  return useDialog(SignatureStatusDialog);
}
