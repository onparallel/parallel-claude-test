import { AlertDescription, AlertIcon, AlertTitle, Flex, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { CloseableAlert } from "../common/CloseableAlert";

interface LimitExceededAlertProps {
  isOpen: boolean;
  onClose: () => void;
}
export function LimitExceededAlert({ isOpen, onClose }: LimitExceededAlertProps) {
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
      </Flex>
    </CloseableAlert>
  );
}
