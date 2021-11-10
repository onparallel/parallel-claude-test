import { Badge, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { NormalLink } from "../common/Link";
import { SmallPopover } from "../common/SmallPopover";

export function TestModeSignatureBadge() {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.test-mode-signature-badge.popover"
            defaultMessage="Test mode allows you to send signatures but it will not have any legal validity. To activate eSignature, <a>contact our support team.</a>"
            values={{
              a: (chunks: any) => (
                <NormalLink href="mailto:support@onparallel.com">{chunks}</NormalLink>
              ),
            }}
          />
        </Text>
      }
    >
      <Badge colorScheme="yellow" textTransform="uppercase">
        <FormattedMessage id="component.test-mode-signature-badge.label" defaultMessage="test" />
      </Badge>
    </SmallPopover>
  );
}
