import { Alert, AlertIcon, AlertProps, Text, Stack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PetitionPreviewSignatureReviewAlert(props: AlertProps) {
  return (
    <Alert status="warning" {...props}>
      <AlertIcon color="yellow.500" />
      <Stack spacing={0.5}>
        <Text>
          <FormattedMessage
            id="component.petition-preview-signature-review-alert.signature-required"
            defaultMessage="<b>Pending eSignature</b>, you can start it from the Replies tab."
          />
        </Text>
        <Text>
          <FormattedMessage
            id="component.petition-preview-signature-review-alert.signature-review"
            defaultMessage="If you make any changes, don't forget to click the <b>Finish</b> button again."
          />
        </Text>
      </Stack>
    </Alert>
  );
}
