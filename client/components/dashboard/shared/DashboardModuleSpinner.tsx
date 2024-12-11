import { Center, Spinner } from "@chakra-ui/react";

export function DashboardModuleSpinner() {
  return (
    <Center flex="1" height="100%">
      <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="primary.500" size="xl" />
    </Center>
  );
}
