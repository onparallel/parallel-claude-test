import {
  Box,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/core";
import { cloneElement, ReactNode, useState } from "react";
import { useId } from "@reach/auto-id";

export function SmallPopover({
  children,
  content,
}: {
  children: ReactNode;
  content: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverId = `popover-${useId()}`;
  return (
    <Popover
      trigger="hover"
      usePortal
      id={popoverId}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
    >
      <PopoverTrigger>
        {cloneElement(children as any, {
          ...(isOpen ? { "aria-describedby": popoverId } : {}),
        })}
      </PopoverTrigger>
      <PopoverContent zIndex={1000} maxWidth={240}>
        <PopoverArrow />
        <Box padding={2} id={popoverId}>
          {content}
        </Box>
      </PopoverContent>
    </Popover>
  );
}
