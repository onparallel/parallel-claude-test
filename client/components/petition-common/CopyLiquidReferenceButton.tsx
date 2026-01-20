import { gql } from "@apollo/client";
import { BracesIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CopyLiquidReferenceButton_PetitionFieldFragment } from "@parallel/graphql/__types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { MouseEvent } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "../common/IconButtonWithTooltip";

export interface CopyLiquidReferenceButtonProps extends Omit<IconButtonWithTooltipProps, "label"> {
  field: CopyLiquidReferenceButton_PetitionFieldFragment;
  onAddAliasToField?: () => Promise<string>;
}

export const CopyLiquidReferenceButton = chakraForwardRef<"button", CopyLiquidReferenceButtonProps>(
  function CopyReferenceIconButton({ field, onClick, onAddAliasToField, ...props }, ref) {
    const intl = useIntl();
    const copyFormula = useClipboardWithToast({
      text: intl.formatMessage({
        id: "component.copy-liquid-reference-button.reference-copied",
        defaultMessage: "Copied to clipboard!",
      }),
    });

    return (
      <IconButtonWithTooltip
        ref={ref}
        icon={<BracesIcon />}
        fontSize="16px"
        onClick={async (event: MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          try {
            const alias = field.alias ?? (await onAddAliasToField!());
            const defaultFilter =
              field.type === "DATE" ? " | date" : field.type === "NUMBER" ? " | number" : "";
            const loopVariable = intl.formatMessage({
              id: "generic.liquid-loop-variable-name",
              defaultMessage: "reply",
            });

            // If checkbox max is 1 we just show the only possible reply, else, we show a list of replies
            const value =
              field.type === "FIELD_GROUP"
                ? `{{ ${alias}.size }}`
                : (field.type === "CHECKBOX" &&
                      (field.options.limit.type === "UNLIMITED" || field.options.limit.max > 1)) ||
                    field.multiple ||
                    (field.isChild && field.parent?.multiple)
                  ? [
                      `{% for ${loopVariable} in ${alias} -%}`,
                      `- {{ ${loopVariable}${defaultFilter} }}`,
                      `{% endfor %}`,
                    ].join("\n")
                  : field.type === "CHECKBOX"
                    ? `{{ ${alias}[0] }}`
                    : `{{ ${alias}${defaultFilter} }}`;
            copyFormula({ value });
          } catch {}
        }}
        size="xs"
        label={intl.formatMessage({
          id: "component.copy-liquid-reference-button.copy-reference",
          defaultMessage: "Copy reference",
        })}
        {...props}
      />
    );
  },
);

const _fragments = {
  PetitionField: gql`
    fragment CopyLiquidReferenceButton_PetitionField on PetitionField {
      id
      alias
      type
      multiple
      options
      isChild
      parent {
        id
        multiple
      }
    }
  `,
};
