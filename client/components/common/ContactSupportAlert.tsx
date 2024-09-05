import { Alert, AlertDescription, AlertIcon, HStack, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

interface ContactSupportAlertProps extends ThemingProps<"Alert"> {
  body: ReactNode;
  contactMessage: string;
}

export const ContactSupportAlert = chakraForwardRef<"div", ContactSupportAlertProps>(
  function ContactSupportAlert({ body, contactMessage, ...props }, ref) {
    return (
      <Alert status="info" rounded="md" {...props} ref={ref}>
        <AlertIcon />
        <HStack spacing={4} width="100%">
          <AlertDescription flex="1">{body}</AlertDescription>
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
  },
);
