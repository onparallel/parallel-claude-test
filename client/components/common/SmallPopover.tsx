import {
  Box,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverProps,
  PopoverTrigger,
  Portal,
  useTheme,
} from "@chakra-ui/core";
import { useId } from "@reach/auto-id";
import { cloneElement, ReactNode, useState } from "react";

export function SmallPopover({
  children,
  placement,
  content,
}: {
  content: ReactNode;
  placement?: PopoverProps["placement"];
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const popoverId = `popover-${useId()}`;
  return (
    <Popover
      trigger="hover"
      id={popoverId}
      placement={placement}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
    >
      <PopoverTrigger>
        {cloneElement(children as any, {
          ...(isOpen ? { "aria-describedby": popoverId } : {}),
        })}
      </PopoverTrigger>
      <Portal>
        <PopoverContent zIndex={theme.zIndices.popover} maxWidth={240}>
          <PopoverArrow />
          <Box paddingY={2} paddingX={3} id={popoverId}>
            {content}
          </Box>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}
