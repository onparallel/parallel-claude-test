import { Box, Button, BoxProps } from "@chakra-ui/core";
import { ReactElement } from "react";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

type ResponsiveButtonProps = {
  icon: ReactElement;
  label: string;
  colorScheme?: string;
  iconOnly?: boolean;
  onClick: (...args: any[]) => void;
} & BoxProps;
export function ResponsiveButton({
  icon,
  label,
  iconOnly,
  colorScheme,
  onClick,
  ...props
}: ResponsiveButtonProps) {
  return (
    <Box {...props}>
      <IconButtonWithTooltip
        display={iconOnly ? "flex" : { base: "flex", md: "none" }}
        colorScheme={colorScheme ?? "purple"}
        icon={icon}
        onClick={onClick}
        label={label}
      />
      <Button
        display={iconOnly ? "none" : { base: "none", md: "flex" }}
        colorScheme={colorScheme ?? "purple"}
        rightIcon={icon}
        onClick={onClick}
      >
        {label}
      </Button>
    </Box>
  );
}
