import { Alert, AlertIcon, AlertProps, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PetitionPreviewOnlyAlert(props: AlertProps) {
  return (
    <Alert status="info" {...props}>
      <AlertIcon />
      <Text>
        <FormattedMessage
          id="page.preview.template-only-cache-alert"
          defaultMessage="<b>Preview only</b> - Changes you add as replies or comments will not be saved. To complete and submit this template click on <b>Use template</b>."
        />
      </Text>
    </Alert>
  );
}
