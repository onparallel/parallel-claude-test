import { IconButton, Tooltip, TooltipProps } from "@chakra-ui/react";
import { ClipboardIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import copy from "clipboard-copy";
import { MouseEvent, useState } from "react";
import { useIntl } from "react-intl";

export type CopyToClipboardButtonProps = {
  text: string;
  placement?: TooltipProps["placement"];
};

export const CopyToClipboardButton = chakraForwardRef<
  "button",
  CopyToClipboardButtonProps
>(function CopyToClipboardButton(
  { "aria-label": ariaLabel, text, placement, onClick, onMouseOut, ...props },
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
    copy(text);
    setState(true);
    onClick?.(event);
  }

  function handleMouseOut(event: MouseEvent<HTMLButtonElement>) {
    onMouseOut?.(event);
    setTimeout(() => {
      setState(false);
    });
  }

  return (
    <Tooltip label={copied ? labels.copied : labels.copy} placement={placement}>
      <IconButton
        ref={ref}
        aria-label={ariaLabel ?? labels.copy}
        icon={<ClipboardIcon />}
        onClick={handleClick}
        onMouseOut={handleMouseOut}
        {...props}
      />
    </Tooltip>
  );
});
