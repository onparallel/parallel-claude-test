import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

export const DeletedContact = chakraForwardRef<"span">((props, ref) => {
  return (
    <Text ref={ref as any} as="span" textStyle="hint" {...props}>
      <FormattedMessage id="generic.deleted-contact" defaultMessage="Deleted contact" />
    </Text>
  );
});
