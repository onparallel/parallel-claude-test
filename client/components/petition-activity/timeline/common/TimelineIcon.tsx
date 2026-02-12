import { ComponentWithAs, Icon, IconProps } from "@chakra-ui/react";
import { BoxProps, Flex } from "@parallel/components/ui";

export function TimelineIcon({
  icon,
  color,
  backgroundColor = "gray.50",
  size = "36px",
}: {
  icon: ComponentWithAs<"svg", IconProps>;
  color?: BoxProps["color"];
  backgroundColor?: BoxProps["backgroundColor"];
  size?: BoxProps["width"];
}) {
  return (
    <Flex
      borderRadius="full"
      color={color}
      backgroundColor={backgroundColor}
      alignItems="center"
      justifyContent="center"
      border="2px solid"
      borderColor="gray.50"
      width={size}
      height={size}
    >
      <Icon as={icon} role="presentation" />
    </Flex>
  );
}
