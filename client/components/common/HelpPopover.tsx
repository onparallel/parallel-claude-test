import { forwardRef, IconProps, Placement } from "@chakra-ui/core";
import { QuestionIcon } from "@parallel/chakra/icons";
import { ReactNode } from "react";
import { SmallPopover } from "../common/SmallPopover";

export type HelpPopoverProps = {
  children: ReactNode;
  placement?: Placement;
} & IconProps;

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
