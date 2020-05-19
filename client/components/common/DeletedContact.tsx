import { Text } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";

export function DeletedContact() {
  return (
    <Text as="span" color="gray.400" fontStyle="italic">
      <FormattedMessage
        id="generic.deleted-contact"
        defaultMessage="Deleted contact"
      />
    </Text>
  );
}
