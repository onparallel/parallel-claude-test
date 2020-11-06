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
  content,
  ...props
}: {
  content: ReactNode;
  children: ReactNode;
} & Pick<PopoverProps, "placement" | "openDelay">) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const popoverId = `popover-${useId()}`;
  return (
    <Popover
      trigger="hover"
      id={popoverId}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      {...props}
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
