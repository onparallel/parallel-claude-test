import { Alert, AlertIcon, AlertProps, Text, Stack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";

export function PetitionPreviewSignatureReviewAlert(props: AlertProps) {
  const intl = useIntl();
  return (
    <Alert status="warning" {...props}>
      <AlertIcon color="yellow.500" />
      <Stack spacing={0.5}>
        <Text>
          <FormattedMessage
            id="component.petition-preview-signature-review-alert.signature-required"
            defaultMessage="<b>Pending eSignature</b>, you can start it from the {tabName} tab."
            values={{
              tabName: intl.formatMessage({
                id: "petition.header.replies-tab",
                defaultMessage: "Review",
              }),
            }}
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
