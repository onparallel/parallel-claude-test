import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { ContactReference_ContactFragment, Maybe } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { ContactReference } from "../common/ContactReference";
import { DialogProps, useDialog } from "../common/DialogProvider";

export type DeclinedSignatureReasonDialogProps = {
  declineReason: string;
  contact: Maybe<ContactReference_ContactFragment>;
};

export function DeclinedSignatureReasonDialog({
  declineReason,
  contact,
  ...props
}: DialogProps<DeclinedSignatureReasonDialogProps, void>) {
  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton={true}
      {...props}
      header={
        <Heading size="md">
          <ContactReference contact={contact} />
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
