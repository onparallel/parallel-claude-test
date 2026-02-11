import { ButtonOptions, PlacementWithLogical, ThemingProps } from "@chakra-ui/react";
import { ClipboardIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import copy from "copy-to-clipboard";
import { MouseEvent, ReactElement, useState } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

export interface CopyToClipboardButtonProps extends ButtonOptions, ThemingProps<"Button"> {
  text: string;
  placement?: PlacementWithLogical;
  "aria-label"?: string;
  icon?: ReactElement;
  copyLabel?: string;
  copiedLabel?: string;
}

export const CopyToClipboardButton = chakraComponent<"button", CopyToClipboardButtonProps>(
  function CopyToClipboardButton({
    ref,
    "aria-label": ariaLabel,
    text,
    placement,
    icon,
    copyLabel,
    copiedLabel,
    onClick,
    onMouseEnter,
    ...props
  }) {
    const intl = useIntl();
    const labels = {
      copy:
        copyLabel ??
        intl.formatMessage({
          id: "component.copy-to-clipboard-button.copy-label",
          defaultMessage: "Copy to clipboard",
        }),
      copied:
        copiedLabel ??
        intl.formatMessage({
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
  },
);
