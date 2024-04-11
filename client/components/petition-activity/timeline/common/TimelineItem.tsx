import { Box, BoxProps, Flex, useTheme } from "@chakra-ui/react";
import { ReactNode } from "react";

interface TimelineItemProps extends BoxProps {
  icon: ReactNode;
}

export function TimelineItem({ icon, children, ...props }: TimelineItemProps) {
  const { colors } = useTheme();
  return (
    <Box
      display="flex"
      position="relative"
      alignItems="center"
      background={`${colors.transparent} linear-gradient(${colors.gray[300]}, ${colors.gray[300]}) no-repeat 17px / 2px 100%`}
      paddingY={4}
      {...props}
    >
      <Flex width="36px" justifyContent="center">
        {icon}
      </Flex>
      <Flex flex="1" marginStart={2} alignItems="center">
        <Box flex="1">{children}</Box>
      </Flex>
    </Box>
  );
}
