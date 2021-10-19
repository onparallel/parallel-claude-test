import { Box, BoxProps, HStack, StackProps } from "@chakra-ui/react";
import { motion } from "framer-motion";

interface DotIndicatorProps extends StackProps {
  elements: any[];
  selected: number;
}

const MotionBox = motion<Omit<BoxProps, "transition">>(Box);

export function DotIndicator({ elements, selected, ...props }: DotIndicatorProps) {
  return (
    <HStack justifyContent="center" alignItems="center" {...props}>
      {elements.map((_, index) => (
        <Box width={2} height={2} rounded="full" backgroundColor="gray.200" key={index}>
          {selected === index && (
            <MotionBox
              width={2}
              height={2}
              rounded="full"
              backgroundColor="purple.600"
              layoutId="highlight-indicator"
            />
          )}
        </Box>
      ))}
    </HStack>
  );
}
