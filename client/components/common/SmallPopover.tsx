import {
  BoxProps,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverProps,
  PopoverTrigger,
  Portal,
  useId,
} from "@chakra-ui/react";
import { ReactNode, cloneElement } from "react";

export function SmallPopover({
  id,
  isDisabled,
  children,
  content,
  width = "container.5xs",
  maxWidth,
  ...props
}: {
  isDisabled?: boolean;
  content: ReactNode;
  width?: BoxProps["width"];
  maxWidth?: BoxProps["maxWidth"];
} & PopoverProps) {
  const popoverId = useId(id, "small-popover");
  return isDisabled ? (
    <>{children}</>
  ) : (
    <Popover trigger="hover" id={popoverId} {...props}>
      {({ isOpen }) => (
        <>
          <PopoverTrigger>
            {cloneElement(children as any, {
              ...(isOpen ? { "aria-describedby": popoverId } : {}),
            })}
          </PopoverTrigger>
          <Portal>
            <PopoverContent width={width} maxWidth={maxWidth}>
              <PopoverBody id={popoverId}>{content}</PopoverBody>
              <PopoverArrow />
            </PopoverContent>
          </Portal>
        </>
      )}
    </Popover>
  );
}
