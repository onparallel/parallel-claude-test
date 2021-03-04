import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverProps,
  PopoverTrigger,
  Portal,
  useId,
} from "@chakra-ui/react";
import { cloneElement, ReactNode, useState } from "react";

export function SmallPopover({
  isDisabled,
  children,
  content,
  ...props
}: {
  isDisabled?: boolean;
  content: ReactNode;
  children: ReactNode;
} & Pick<PopoverProps, "placement">) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverId = useId(undefined, "small-popover");
  return isDisabled ? (
    <>{children}</>
  ) : (
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
