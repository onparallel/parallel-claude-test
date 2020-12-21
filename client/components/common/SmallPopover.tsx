import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverProps,
  PopoverTrigger,
  Portal,
} from "@chakra-ui/react";
import { useId } from "@reach/auto-id";
import { cloneElement, ReactNode, useState } from "react";

export function SmallPopover({
  children,
  content,
  ...props
}: {
  content: ReactNode;
  children: ReactNode;
} & Pick<PopoverProps, "placement">) {
  const [isOpen, setIsOpen] = useState(false);
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
        <PopoverContent>
          <PopoverBody id={popoverId}>{content}</PopoverBody>
          <PopoverArrow />
        </PopoverContent>
      </Portal>
    </Popover>
  );
}
