import {
  BoxProps,
  PseudoBox,
  Flex,
  Box,
  IconProps,
  Icon,
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
  return (
    <PseudoBox
      display="flex"
      alignItems="center"
      position="relative"
      background="rgba(0, 0, 0, 0) linear-gradient(rgb(86, 80, 222), rgb(86, 80, 222)) no-repeat 17px / 2px 100%"
      paddingY={4}
      {...props}
    >
      <Flex width="36px" alignItems="center" justifyContent="center">
        {icon}
      </Flex>
      <Box flex="1" marginLeft={2}>
        {children}
      </Box>
    </PseudoBox>
  );
}

export function TimelineIcon({
  icon,
  color,
  backgroundColor,
}: {
  icon: IconProps["name"];
  color?: BoxProps["color"];
  backgroundColor?: BoxProps["backgroundColor"];
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
      width="36px"
      height="36px"
    >
      <Icon name={icon} size="14px" />
    </Flex>
  );
}
