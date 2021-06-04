import { Text } from "@chakra-ui/react";
import { PetitionComposeField_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export type CheckboxTypeLabelProps = {
  field: PetitionComposeField_PetitionFieldFragment;
};

export function CheckboxTypeLabel({ field, ...props }: CheckboxTypeLabelProps) {
  const { type = "UNLIMITED", min = 1, max = 1 } = field.options.limit ?? {};

  const show =
    field.type == "CHECKBOX" &&
    ((type != "RADIO" && max > 1) || type == "UNLIMITED");

  const getText = () => {
    switch (type) {
      case "UNLIMITED":
        return (
          <FormattedMessage
            id="component.checkbox-type-label.unlimited"
            defaultMessage="Choose as many options as you want"
          />
        );

      case "EXACT":
        return (
          <FormattedMessage
            id="component.checkbox-type-label.exact"
            defaultMessage="Choose {X} {X, plural, =1{option} other{options}}"
            values={{ X: max }}
          />
        );

      case "RANGE":
        return min === 1 ? (
          max === 1 ? (
            <FormattedMessage
              id="component.checkbox-type-label.exact"
              defaultMessage="Choose {X} {X, plural, =1{option} other{options}}"
              values={{ X: max }}
            />
          ) : (
            <FormattedMessage
              id="component.checkbox-type-label.up-to"
              defaultMessage="Choose up to {X} options"
              values={{ X: max }}
            />
          )
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

  return <>{show ? <Text {...props}>{getText()}</Text> : null}</>;
}
