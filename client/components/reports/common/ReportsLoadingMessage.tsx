import { Center, Spinner } from "@chakra-ui/react";
import { LoadingDynamicText } from "@parallel/components/reports/common/LoadingDynamicText";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

export function ReportsLoadingMessage() {
  return (
    <>
      <Center h="100px" marginBottom={6}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="primary.600"
          size="xl"
        />
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
