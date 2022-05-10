import { Alert, AlertIcon, Box, HStack } from "@chakra-ui/react";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

interface ContactSupportAlertProps {
  body: ReactNode;
  contactMessage: string;
}

export function ContactSupportAlert({ body, contactMessage }: ContactSupportAlertProps) {
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
