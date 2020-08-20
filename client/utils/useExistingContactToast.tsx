import { useToast } from "@chakra-ui/core";
import { useIntl } from "react-intl";

export function useExistingContactToast() {
  const toast = useToast();
  const intl = useIntl();
  return () => {
    toast({
      title: intl.formatMessage({
        id: "component.existing-contact-toast.title",
        defaultMessage: "Existing contact",
      }),
      description: intl.formatMessage({
        id: "component.existing-contact-toast.description",
        defaultMessage: "This contact already exists.",
      }),
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  };
}
