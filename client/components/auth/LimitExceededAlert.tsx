import { AlertDescription, AlertIcon, AlertTitle, Flex, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { CloseableAlert, CloseableAlertProps } from "../common/CloseableAlert";

export function LimitExceededAlert(props: CloseableAlertProps) {
  return (
    <CloseableAlert status="error" variant="subtle" rounded="md" {...props}>
      <AlertIcon />
      <Stack>
        <AlertTitle>
          <FormattedMessage
            id="component.limit-exceeded-alert.title"
            defaultMessage="Limit exceeded"
          />
        </AlertTitle>
        <AlertDescription>
          <Text>
            <FormattedMessage
              id="component.limit-exceeded-alert.body"
              defaultMessage=" Attempt limit exceeded, please try after some time."
            />
          </Text>
        </AlertDescription>
      </Stack>
    </CloseableAlert>
  );
}
