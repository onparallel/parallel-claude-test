import { Alert, AlertIcon, Box, Button, HStack } from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { SupportButton } from "./SupportButton";

interface UpgradeAppSumoAlertProps {
  body: ReactNode;
  contactMessage: string;
  invoiceItemUuid: string;
  isContactSupport: boolean;
}

export function UpgradeAppSumoAlert({
  body,
  contactMessage,
  invoiceItemUuid,
  isContactSupport,
}: UpgradeAppSumoAlertProps) {
  return (
    <Alert status="info" rounded="md">
      <AlertIcon />
      <HStack spacing={4} width="100%">
        <Box flex="1">{body}</Box>
        {isContactSupport ? (
          <SupportButton
            variant="outline"
            colorScheme="blue"
            backgroundColor="white"
            message={contactMessage}
          >
            <FormattedMessage id="generic.contact" defaultMessage="Contact" />
          </SupportButton>
        ) : (
          <Button
            as="a"
            href={`https://appsumo.com/account/redemption/${invoiceItemUuid}#change-plan`}
            rel="noopener"
            target="_blank"
            variant="outline"
            colorScheme="blue"
            backgroundColor="white"
          >
            <FormattedMessage id="generic.upgrade" defaultMessage="Upgrade" />
          </Button>
        )}
      </HStack>
    </Alert>
  );
}
