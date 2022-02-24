import { Circle, HStack, SquareProps, StackProps } from "@chakra-ui/react";
import { motion } from "framer-motion";

interface StepsIndicatorProps extends StackProps {
  numberOfSteps: number;
  currentStep: number;
}

const MotionCircle = motion<SquareProps>(Circle);

export function StepsIndicator({ numberOfSteps, currentStep, ...props }: StepsIndicatorProps) {
  return (
    <HStack justifyContent="center" alignItems="center" {...props}>
      {[...Array(numberOfSteps)].map((_, index) => (
        <Circle size={2} backgroundColor="gray.200" key={index}>
          {currentStep === index && (
            <MotionCircle size={2} backgroundColor="purple.600" layoutId="highlight-indicator" />
          )}
        </Circle>
      ))}
    </HStack>
  );
}
