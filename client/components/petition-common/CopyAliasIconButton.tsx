import { CopyPropertyIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionField } from "@parallel/graphql/__types";
import { MouseEvent } from "react";
import { CopyToClipboardButton, CopyToClipboardButtonProps } from "../common/CopyToClipboardButton";

export interface CopyAliasIconButtonProps
  extends Omit<CopyToClipboardButtonProps, "aria-label" | "placement" | "text" | "icon"> {
  field: Pick<PetitionField, "alias" | "type">;
}

export const CopyAliasIconButton = chakraForwardRef<"button", CopyAliasIconButtonProps>(
  function CopyReferenceIconButton({ field, onClick, ...props }, ref) {
    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      event.stopPropagation();
      onClick?.(event);
    }

    const text =
      field.type === "DATE"
        ? `{{ ${field.alias} | date }}`
        : field.type === "NUMBER"
        ? `{{ ${field.alias} | number }}`
        : `{{ ${field.alias} }}`;

    return (
      <CopyToClipboardButton
        ref={ref}
        text={text}
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
