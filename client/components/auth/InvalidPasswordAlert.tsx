import { AlertDescription, AlertIcon, AlertTitle } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { CloseableAlert, CloseableAlertProps } from "../common/CloseableAlert";
import { Stack, Text } from "@parallel/components/ui";

export function InvalidPasswordAlert(props: CloseableAlertProps) {
  return (
    <CloseableAlert status="error" rounded="md" {...props}>
      <AlertIcon />
      <Stack>
        <AlertTitle>
          <FormattedMessage
            id="component.invalid-password-alert.title"
            defaultMessage="Invalid password"
          />
        </AlertTitle>
        <AlertDescription>
          <Text>
            <FormattedMessage
              id="component.invalid-password-alert.body"
              defaultMessage="The provided password cannot be used for security reasons. Please try again with a stronger password."
            />
          </Text>
        </AlertDescription>
      </Stack>
    </CloseableAlert>
  );
}
