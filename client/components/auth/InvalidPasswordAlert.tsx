import { AlertDescription, AlertIcon, AlertTitle, Flex, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { CloseableAlert } from "../common/CloseableAlert";

interface InvalidPasswordAlertProps {
  isOpen: boolean;
  onClose: () => void;
}
export function InvalidPasswordAlert({ isOpen, onClose }: InvalidPasswordAlertProps) {
  return (
    <CloseableAlert
      isOpen={isOpen}
      onClose={onClose}
      status="error"
      variant="subtle"
      rounded="md"
      zIndex={2}
      marginBottom={10}
    >
      <Flex
        alignItems="center"
        justifyContent="flex-start"
        marginX="auto"
        width="100%"
        paddingLeft={4}
        paddingRight={12}
      >
        <AlertIcon />
        <Stack spacing={1}>
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
      </Flex>
    </CloseableAlert>
  );
}
