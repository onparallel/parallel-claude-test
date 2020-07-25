import {
  IconButton,
  IconButtonProps,
  Tooltip,
  TooltipProps,
} from "@chakra-ui/core";
import { ClipboardIcon } from "@parallel/chakra/icons";
import copy from "clipboard-copy";
import { memo, MouseEvent, useState } from "react";
import { useIntl } from "react-intl";

export type CopyToClipboardButtonProps = {
  text: string;
  placement?: TooltipProps["placement"];
} & Omit<IconButtonProps, "icon" | "aria-label">;

export const CopyToClipboardButton = memo(function CopyToClipboardButton({
  text,
  placement,
  onClick,
  onMouseOut,
  ...props
}: CopyToClipboardButtonProps) {
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
    <Tooltip
      label={copied ? labels.copied : labels.copy}
      aria-label={labels.copy}
      placement={placement}
    >
      <IconButton
        aria-label={labels.copy}
        icon={<ClipboardIcon />}
        onClick={handleClick}
        onMouseOut={handleMouseOut}
        {...props}
      />
    </Tooltip>
  );
});
