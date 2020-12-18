import { IconProps, Placement } from "@chakra-ui/react";
import { QuestionIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { SmallPopover } from "../common/SmallPopover";

export type HelpPopoverProps = {
  children: ReactNode;
  placement?: Placement;
} & IconProps;

export const HelpPopover = chakraForwardRef<"svg", HelpPopoverProps>(function (
  { children, placement = "bottom", ...props },
  ref
) {
  return (
    <SmallPopover content={children} placement={placement}>
      <QuestionIcon ref={ref} color="gray.200" {...(props as any)} />
    </SmallPopover>
  );
});
