import { Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";

export const DeletedContact = chakraForwardRef<"span", TextProps>(
  (props, ref) => {
    return (
      <Text ref={ref as any} as="span" textStyle="hint" {...props}>
        <FormattedMessage
          id="generic.deleted-contact"
          defaultMessage="Deleted contact"
        />
      </Text>
    );
  }
);
