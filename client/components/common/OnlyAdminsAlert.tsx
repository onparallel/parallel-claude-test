import { Alert, AlertDescription, AlertIcon, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function OnlyAdminsAlert() {
  return (
    <Alert status="info" rounded="md">
      <AlertIcon />
      <AlertDescription>
        <Text>
          <FormattedMessage
            id="component.only-admins-alert.body"
            defaultMessage="Only admins can edit these settings. Please ask them if you need any changes on this page."
          />
        </Text>
      </AlertDescription>
    </Alert>
  );
}
