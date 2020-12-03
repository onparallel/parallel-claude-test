import { Box, Button } from "@chakra-ui/core";
import { ReactElement } from "react";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

type ResponsiveButtonProps = {
  key: string;
  icon: ReactElement;
  label: string;
  colorScheme?: string;
  iconOnly?: boolean;
  onClick: (...args: any[]) => void;
};
export function ResponsiveButton({
  key,
  icon,
  label,
  iconOnly,
  colorScheme,
  onClick,
}: ResponsiveButtonProps) {
  return (
    <Box key={key}>
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
