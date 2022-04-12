import { Text, TextProps, Tooltip, TooltipProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import copy from "clipboard-copy";
import { MouseEvent, useState } from "react";
import { useIntl } from "react-intl";

export interface CopyToClipboardTextProps extends TextProps {
  text: string;
  placement?: TooltipProps["placement"];
}

export const CopyToClipboardText = chakraForwardRef<"p", CopyToClipboardTextProps>(
  function CopyToClipboardText({ text, placement, onClick, onMouseOut, children, ...props }, ref) {
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

    function handleClick(event: MouseEvent<HTMLParagraphElement>) {
      copy(text);
      setState(true);
      onClick?.(event);
    }

    function handleMouseOut(event: MouseEvent<HTMLParagraphElement>) {
      onMouseOut?.(event);
      setTimeout(() => {
        setState(false);
      });
    }

    return (
      <Tooltip label={copied ? labels.copied : labels.copy} placement={placement}>
        <Text
          ref={ref}
          cursor="pointer"
          onClick={handleClick}
          onMouseOut={handleMouseOut}
          {...props}
        >
          {children}
        </Text>
      </Tooltip>
    );
  }
);
