import {
  BoxProps,
  PseudoBox,
  Flex,
  Box,
  IconProps,
  Icon,
  useTheme,
} from "@chakra-ui/core";
import { ReactNode } from "react";

export function TimelineItem({
  icon,
  children,
  ...props
}: BoxProps & {
  icon: ReactNode;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <PseudoBox
      display="flex"
      position="relative"
      alignItems="stretch"
      background={`${colors.transparent} linear-gradient(${colors.gray[300]}, ${colors.gray[300]}) no-repeat 17px / 2px 100%`}
      paddingY={4}
      {...props}
    >
      <Flex width="36px" justifyContent="center">
        {icon}
      </Flex>
      <Flex flex="1" marginLeft={2} alignItems="center">
        <Box flex="1">{children}</Box>
      </Flex>
    </PseudoBox>
  );
}

export function TimelineIcon({
  icon,
  color,
  backgroundColor = "gray.50",
  size = "36px",
}: {
  icon: IconProps["name"];
  color?: BoxProps["color"];
  backgroundColor?: BoxProps["backgroundColor"];
  size?: BoxProps["width"];
}) {
  return (
    <Flex
      rounded="100%"
      color={color}
      backgroundColor={backgroundColor}
      alignItems="center"
      justifyContent="center"
      border="2px solid"
      borderColor="gray.50"
      width={size}
      height={size}
    >
      <Icon name={icon} size="14px" />
    </Flex>
  );
}
