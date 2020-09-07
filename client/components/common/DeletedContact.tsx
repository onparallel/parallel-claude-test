import { Text } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";

export function DeletedContact() {
  return (
    <Text as="span" textStyle="hint">
      <FormattedMessage
        id="generic.deleted-contact"
        defaultMessage="Deleted contact"
      />
    </Text>
  );
}
