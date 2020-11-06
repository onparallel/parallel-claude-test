import { forwardRef, Placement } from "@chakra-ui/core";
import { HTMLChakraProps } from "@chakra-ui/system";
import { QuestionIcon } from "@parallel/chakra/icons";
import { ReactNode } from "react";
import { SmallPopover } from "../common/SmallPopover";

export type HelpPopoverProps = {
  children: ReactNode;
  placement?: Placement;
} & HTMLChakraProps<"svg">;

export const HelpPopover = forwardRef<HelpPopoverProps, "svg">(function (
  { children, placement = "bottom", ...props },
  ref
) {
  return (
    <SmallPopover content={children} placement={placement} openDelay={300}>
      <QuestionIcon ref={ref} color="gray.200" {...(props as any)} />
    </SmallPopover>
  );
});
