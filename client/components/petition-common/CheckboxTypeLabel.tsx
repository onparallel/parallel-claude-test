import { Text, TextProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export interface CheckboxTypeLabelProps extends TextProps {
  options: any;
}

export function CheckboxTypeLabel({
  options,
  ...props
}: CheckboxTypeLabelProps) {
  const { type = "UNLIMITED", min = 1, max = 1 } = options.limit ?? {};

  const getText = () => {
    switch (type) {
      case "UNLIMITED":
        return (
          <FormattedMessage
            id="component.checkbox-type-label.unlimited"
            defaultMessage="Choose as many options as you want"
          />
        );

      case "RADIO":
      case "EXACT":
        return (
          <FormattedMessage
            id="component.checkbox-type-label.exact"
            defaultMessage="Choose {X, plural, =1{# option} other{# options}}"
            values={{ X: max }}
          />
        );

      case "RANGE":
        return min === 1 || min === 0 ? (
          <FormattedMessage
            id="component.checkbox-type-label.up-to"
            defaultMessage="Choose up to {X, plural, =1{# option} other{# options}}"
            values={{ X: max }}
          />
        ) : (
          <FormattedMessage
            id="component.checkbox-type-label.range"
            defaultMessage="Choose between {Y} and {X} options"
            values={{ Y: min, X: max }}
          />
        );

      default:
        return (
          <FormattedMessage
            id="component.checkbox-type-label.unlimited"
            defaultMessage="Choose as many options as you want"
          />
        );
    }
  };

  return <Text {...props}>{getText()}</Text>;
}
