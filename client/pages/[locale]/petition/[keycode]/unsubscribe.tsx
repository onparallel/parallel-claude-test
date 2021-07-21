import { Center, Text } from "@chakra-ui/react";
import { withApolloData } from "@parallel/components/common/withApolloData";

function UnsubscribeView() {
  return (
    <Center height="100vh">
      <Text>Unsubscribed!</Text>
    </Center>
  );
}

export default withApolloData(UnsubscribeView);
