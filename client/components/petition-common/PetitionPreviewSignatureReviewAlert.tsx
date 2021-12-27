import { Alert, AlertIcon, AlertProps, Text, Stack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PetitionPreviewSignatureReviewAlert(props: AlertProps) {
  return (
    <Alert status="warning" backgroundColor="yellow.100" {...props}>
      <AlertIcon color="yellow.400" />
      <Stack spacing={0.5}>
        <Text>
          <FormattedMessage
            id="page.preview.signature-required"
            defaultMessage="This petition requires an <b>eSignature</b> to be completed."
          />
        </Text>
        <Text>
          <FormattedMessage
            id="page.preview.signature-review"
            defaultMessage="You can review the replies and initiate the signature from the Replies tab."
          />
        </Text>
      </Stack>
    </Alert>
  );
}
