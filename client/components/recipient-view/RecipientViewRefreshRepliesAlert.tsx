import { Alert, AlertDescription, AlertIcon, Box, Button, Flex, Text } from "@chakra-ui/react";
import { Tone } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

interface RecipientViewRefreshRepliesAlertProps {
  tone?: Tone;
  onRefetch?: () => Promise<void>;
}

export function RecipientViewRefreshRepliesAlert({
  tone = "INFORMAL",
  onRefetch,
}: RecipientViewRefreshRepliesAlertProps) {
  return (
    <Alert status="info" paddingX={6} paddingY={3}>
      <Flex
        margin="auto"
        width="100%"
        padding={0}
        flexDirection={{ base: "column", sm: "row" }}
        gap={{ base: 2, sm: 6 }}
      >
        <Flex alignItems={{ base: "start", sm: "center" }} flex="1">
          <AlertIcon />
          <AlertDescription>
            <Text>
              <FormattedMessage
                id="component.recipient-view-refresh-replies-alert.description"
                defaultMessage="There is a more recent version of this page. Refresh to see all added replies."
                values={{ tone }}
              />
            </Text>
          </AlertDescription>
        </Flex>
        <Box alignSelf={{ base: "flex-end", sm: "center" }}>
          <Button onClick={onRefetch} background="white" fontSize="md" size="sm">
            <FormattedMessage
              id="component.recipient-view-refresh-replies-alert.refetch-button"
              defaultMessage="Refresh replies"
            />
          </Button>
        </Box>
      </Flex>
    </Alert>
  );
}
