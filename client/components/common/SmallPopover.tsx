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
  id,
  isDisabled,
  children,
  content,
  ...props
}: {
  isDisabled?: boolean;
  content: ReactNode;
} & PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverId = useId(id, "small-popover");
  return isDisabled ? (
    <>{children}</>
  ) : (
    <Popover
      trigger="hover"
      id={popoverId}
      onOpen={() => {
        props.onOpen?.();
        setIsOpen(true);
      }}
      onClose={() => {
        props.onClose?.();
        setIsOpen(false);
      }}
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
