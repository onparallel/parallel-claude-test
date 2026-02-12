import { Box, BoxProps } from "@parallel/components/ui";

export type DividerProps = Omit<BoxProps, "color"> & {
  isVertical?: boolean;
  color?: BoxProps["borderColor"];
};

export function Divider({ isVertical, color, ...props }: DividerProps) {
  return (
    <Box
      {...(isVertical ? { borderStart: "1px solid" } : { borderBottom: "1px solid" })}
      borderColor={color || "gray.200"}
      {...props}
    />
  );
}
