import { Alert, AlertIcon, Box, HStack } from "@chakra-ui/react";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

interface ContactAlertProps {
  body: ReactNode;
  contactMessage: string;
}

export function ContactAlert({ body, contactMessage }: ContactAlertProps) {
  return (
    <Alert status="info" rounded="md">
      <AlertIcon />
      <HStack spacing={4} width="100%">
        <Box flex="1">{body}</Box>
        <SupportButton
          variant="outline"
          colorScheme="blue"
          backgroundColor="white"
          message={contactMessage}
        >
          <FormattedMessage id="generic.contact" defaultMessage="Contact" />
        </SupportButton>
      </HStack>
    </Alert>
  );
}
