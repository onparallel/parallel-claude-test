import { IconButton, IconButtonProps, Tooltip, TooltipProps } from "@chakra-ui/react";
import { ClipboardIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import copy from "clipboard-copy";
import { MouseEvent, useState } from "react";
import { useIntl } from "react-intl";

export interface CopyToClipboardButtonProps extends Omit<IconButtonProps, "icon" | "aria-label"> {
  text: string;
  placement?: TooltipProps["placement"];
  "aria-label"?: string;
}

export const CopyToClipboardButton = chakraForwardRef<"button", CopyToClipboardButtonProps>(
  function CopyToClipboardButton(
    { "aria-label": ariaLabel, text, placement, onClick, onMouseEnter, ...props },
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
      copy(text);
      setState(true);
      onClick?.(event);
    }

    function handleMouseEnter(event: MouseEvent<HTMLButtonElement>) {
      if (copied) setState(false);
      onMouseEnter?.(event);
    }

    return (
      <Tooltip label={copied ? labels.copied : labels.copy} placement={placement}>
        <IconButton
          ref={ref}
          aria-label={ariaLabel ?? labels.copy}
          icon={<ClipboardIcon />}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          {...props}
        />
      </Tooltip>
    );
  }
);
