import { PopoverProps, Text } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";

export interface TemplateIconComplianceProps extends PopoverProps {
  anonymizeAfterMonths: number;
}

export function TemplateIconCompliance({
  anonymizeAfterMonths,
  ...props
}: TemplateIconComplianceProps) {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.template-icon-compliance.text"
            defaultMessage="Data of closed petitions will be anonymized after {months, plural, =1 {# month} other {# months}}."
            values={{ months: anonymizeAfterMonths }}
          />
        </Text>
      }
      width="200px"
      {...props}
    >
      <TimeIcon color="gray.600" boxSize={4} />
    </SmallPopover>
  );
}
