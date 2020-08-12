import { useToast } from "@chakra-ui/core";
import { useIntl } from "react-intl";

export function useExistingContactToast() {
  const toast = useToast();
  const intl = useIntl();
  return () => {
    toast({
      title: intl.formatMessage({
        id: "component.recipient-select.existing-contact.title",
        defaultMessage: "Existing contact",
      }),
      description: intl.formatMessage({
        id: "component.recipient-select.existing-contact.description",
        defaultMessage: "This contact already exists.",
      }),
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  };
}
