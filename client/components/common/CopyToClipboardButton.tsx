import { IconButtonProps, PlacementWithLogical } from "@chakra-ui/react";
import { ClipboardIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import copy from "clipboard-copy";
import { MouseEvent, ReactElement, useState } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

export interface CopyToClipboardButtonProps extends Omit<IconButtonProps, "icon" | "aria-label"> {
  text: string;
  placement?: PlacementWithLogical;
  "aria-label"?: string;
  icon?: ReactElement;
}

export const CopyToClipboardButton = chakraForwardRef<"button", CopyToClipboardButtonProps>(
  function CopyToClipboardButton(
    { "aria-label": ariaLabel, text, placement, icon, onClick, onMouseEnter, ...props },
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
      if (copied) {
        setState(false);
      }
      onMouseEnter?.(event);
    }

    return (
      <IconButtonWithTooltip
        label={copied ? labels.copied : labels.copy}
        placement={placement}
        ref={ref}
        aria-label={ariaLabel ?? labels.copy}
        icon={icon ?? <ClipboardIcon />}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        {...props}
      />
    );
  }
);
