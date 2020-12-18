import { Box, BoxProps, Flex, useTheme } from "@chakra-ui/react";
import { ReactElement, ReactNode } from "react";

interface TimelineItemProps extends BoxProps {
  icon: ReactNode;
}

export function TimelineItem({ icon, children, ...props }: TimelineItemProps) {
  const { colors } = useTheme();
  return (
    <Box
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
    </Box>
  );
}

export function TimelineIcon({
  icon,
  color,
  backgroundColor = "gray.50",
  size = "36px",
}: {
  icon: ReactElement;
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
      {icon}
    </Flex>
  );
}
