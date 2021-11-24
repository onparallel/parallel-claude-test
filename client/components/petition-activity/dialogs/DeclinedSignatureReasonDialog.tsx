import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { SignerReference } from "@parallel/components/common/SignerReference";
import { Maybe, SignerReference_PetitionSignerFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export type DeclinedSignatureReasonDialogProps = {
  declineReason: string;
  signer: Maybe<SignerReference_PetitionSignerFragment>;
};

export function DeclinedSignatureReasonDialog({
  declineReason,
  signer,
  ...props
}: DialogProps<DeclinedSignatureReasonDialogProps, void>) {
  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton={true}
      {...props}
      header={
        <Heading size="md">
          <SignerReference signer={signer} />
        </Heading>
      }
      body={
        <Stack>
          <Box>
            <Text>{declineReason}</Text>
          </Box>
        </Stack>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={null}
    />
  );
}

export function useDeclinedSignatureReasonDialog() {
  return useDialog(DeclinedSignatureReasonDialog);
}
