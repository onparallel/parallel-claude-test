import { IconButtonProps } from "@chakra-ui/react";
import { CopyPropertyIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import copy from "clipboard-copy";
import { MouseEvent, useState } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

export interface CopyReferenceIconButtonProps
  extends Omit<IconButtonProps, "aria-label" | "placement"> {
  "aria-label"?: string;
  alias: string;
}

export const CopyReferenceIconButton = chakraForwardRef<"button", CopyReferenceIconButtonProps>(
  function CopyReferenceIconButton(
    { "aria-label": ariaLabel, alias, onClick, onMouseEnter, ...props },
    ref
  ) {
    const intl = useIntl();
    const labels = {
      copy: intl.formatMessage({
        id: "component.copy-to-clipboard-button.copy-label",
        defaultMessage: "Copy to clipboard",
      }),
      copied: intl.formatMessage({
        id: "component.copy-to-clipboard-button.copied-label",
        defaultMessage: "Copied to clipboard!",
      }),
    };
    const [copied, setState] = useState(false);

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      event.preventDefault();
      event.stopPropagation();
      copy(alias);
      setState(true);
      onClick?.(event);
    }

    function handleMouseEnter(event: MouseEvent<HTMLButtonElement>) {
      if (copied) setState(false);
      onMouseEnter?.(event);
    }

    return (
      <IconButtonWithTooltip
        label={copied ? labels.copied : labels.copy}
        icon={<CopyPropertyIcon />}
        fontSize="16px"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        size="xs"
        background="white"
        boxShadow="md"
        _hover={{
          boxShadow: "lg",
        }}
        ref={ref}
        tabIndex={0}
        {...props}
      />
    );
  }
);
