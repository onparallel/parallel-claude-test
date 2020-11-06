import { forwardRef, Text } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";

export const DeletedContact = forwardRef<{}, "span">((props, ref) => {
  return (
    <Text ref={ref as any} as="span" textStyle="hint" {...props}>
      <FormattedMessage
        id="generic.deleted-contact"
        defaultMessage="Deleted contact"
      />
    </Text>
  );
});
