import { BoxProps, IconProps, Placement } from "@chakra-ui/react";
import { QuestionIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { SmallPopover } from "../common/SmallPopover";

export type HelpPopoverProps = {
  children: ReactNode;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
} & IconProps;

export const HelpPopover = chakraForwardRef<"svg", HelpPopoverProps>(function (
  { children, placement = "bottom", popoverWidth, ...props },
  ref
) {
  return (
    <SmallPopover content={children} placement={placement} width={popoverWidth}>
      <QuestionIcon
        ref={ref}
        color="gray.200"
        _hover={{ color: "gray.300" }}
        {...(props as any)}
      />
    </SmallPopover>
  );
});
