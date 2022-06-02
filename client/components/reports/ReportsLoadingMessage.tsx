import { Center, Spinner, Text } from "@chakra-ui/react";
import { LoadingDynamicText } from "@parallel/components/reports/LoadingDynamicText";
import { FormattedMessage } from "react-intl";

export function ReportsLoadingMessage() {
  return (
    <>
      <Center h="100px" marginBottom={6}>
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="purple.600" size="xl" />
      </Center>
      <Text fontWeight="bold">
        <FormattedMessage
          id="component.reports-loading-message.wait-while-load"
          defaultMessage="Wait while we load your reports..."
        />
      </Text>
      <LoadingDynamicText />
    </>
  );
}
