import { gql } from "@apollo/client";
import { CopyPropertyIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  CopyAliasIconButton_PetitionFieldFragment,
  PetitionField,
} from "@parallel/graphql/__types";
import { MouseEvent, useCallback } from "react";
import { useIntl } from "react-intl";
import { CopyToClipboardButton, CopyToClipboardButtonProps } from "../common/CopyToClipboardButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

export interface CopyAliasIconButtonProps
  extends Omit<CopyToClipboardButtonProps, "aria-label" | "placement" | "text" | "icon"> {
  field: CopyAliasIconButton_PetitionFieldFragment;
}

export const CopyAliasIconButton = Object.assign(
  chakraForwardRef<"button", CopyAliasIconButtonProps>(function CopyReferenceIconButton(
    { field, onClick, ...props },
    ref
  ) {
    const intl = useIntl();
    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      event.stopPropagation();
      onClick?.(event);
    }
    const buildAliasInterpolation = useBuildAliasInterpolation(field);

    if (!field.alias) {
      return (
        <IconButtonWithTooltip
          ref={ref}
          icon={<CopyPropertyIcon />}
          fontSize="16px"
          onClick={handleClick}
          size="xs"
          label={intl.formatMessage({
            id: "component.copy-alias-button.copy-reference",
            defaultMessage: "Copy reference",
          })}
          {...props}
        />
      );
    }

    return (
      <CopyToClipboardButton
        ref={ref}
        text={buildAliasInterpolation(field.alias)}
        icon={<CopyPropertyIcon />}
        fontSize="16px"
        onClick={handleClick}
        size="xs"
        copyLabel={intl.formatMessage({
          id: "component.copy-alias-button.copy-reference",
          defaultMessage: "Copy reference",
        })}
        copiedLabel={intl.formatMessage({
          id: "component.copy-alias-button.copied-reference",
          defaultMessage: "Copied to clipboard!",
        })}
        {...props}
      />
    );
  }),
  {
    fragments: {
      PetitionField: gql`
        fragment CopyAliasIconButton_PetitionField on PetitionField {
          id
          alias
          type
          multiple
          options
        }
      `,
    },
  }
);

export function useBuildAliasInterpolation(
  field: Pick<PetitionField, "type" | "multiple" | "options">
) {
  const intl = useIntl();

  const { type, multiple, options } = field;

  return useCallback(
    (alias) => {
      const defaultFilter = type === "DATE" ? " | date" : type === "NUMBER" ? " | number" : "";
      const loopVariable = intl.formatMessage({
        id: "component.reference-options-menu.loop-variable",
        defaultMessage: "reply",
      });

      // If checkbox max is 1 we trate it like a radio button, if is unlimited we ignore the max
      return (type === "CHECKBOX" &&
        (options.limit.type === "UNLIMITED" || options.limit.max > 1)) ||
        multiple
        ? [
            `{% for ${loopVariable} in ${alias} -%}`,
            `- {{ ${loopVariable}${defaultFilter} }}`,
            `{% endfor %}`,
          ].join("\n")
        : type === "CHECKBOX"
        ? `{{ ${alias}[0] }}`
        : `{{ ${alias}${defaultFilter} }}`;
    },
    [type, multiple, options]
  );
}
