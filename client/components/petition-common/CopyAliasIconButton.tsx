import { CopyPropertyIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionField } from "@parallel/graphql/__types";
import { MouseEvent } from "react";
import { useIntl } from "react-intl";
import { CopyToClipboardButton, CopyToClipboardButtonProps } from "../common/CopyToClipboardButton";

export interface CopyAliasIconButtonProps
  extends Omit<CopyToClipboardButtonProps, "aria-label" | "placement" | "text" | "icon"> {
  field: Pick<PetitionField, "alias" | "type" | "multiple" | "options">;
}

export const CopyAliasIconButton = chakraForwardRef<"button", CopyAliasIconButtonProps>(
  function CopyReferenceIconButton({ field, onClick, ...props }, ref) {
    const intl = useIntl();

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      event.stopPropagation();
      onClick?.(event);
    }

    const defaultFilter =
      field.type === "DATE" ? " | date" : field.type === "NUMBER" ? " | number" : "";
    const loopVariable = intl.formatMessage({
      id: "component.reference-options-menu.loop-variable",
      defaultMessage: "reply",
    });
    const interpolation =
      (field.type === "CHECKBOX" && field.options.limit.type === "UNLIMITED") || field.multiple
        ? [
            `{% for ${loopVariable} in ${field.alias} -%}`,
            `- {{ ${loopVariable}${defaultFilter} }}`,
            `{% endfor %}`,
          ].join("\n")
        : `{{ ${field.alias}${defaultFilter} }}`;

    return (
      <CopyToClipboardButton
        ref={ref}
        text={interpolation}
        icon={<CopyPropertyIcon />}
        fontSize="16px"
        onClick={handleClick}
        size="xs"
        background="white"
        boxShadow="md"
        _hover={{
          boxShadow: "lg",
        }}
        {...props}
      />
    );
  }
);
