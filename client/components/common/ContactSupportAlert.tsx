import { chakraComponent } from "@parallel/chakra/utils";
import { Alert, AlertDescription, AlertIcon, ThemingProps } from "@chakra-ui/react";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { HStack } from "@parallel/components/ui";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

interface ContactSupportAlertProps extends ThemingProps<"Alert"> {
  body: ReactNode;
  contactMessage: string;
}

export const ContactSupportAlert = chakraComponent<"div", ContactSupportAlertProps>(
  function ContactSupportAlert({ ref, body, contactMessage, ...props }) {
    return (
      <Alert status="info" rounded="md" {...props} ref={ref}>
        <AlertIcon />
        <HStack gap={4} width="100%">
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
