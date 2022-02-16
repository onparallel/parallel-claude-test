import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Children } from "react";

export interface StepsProps {
  currentStep: number;
  startingIndex?: number;
}

export const Steps = chakraForwardRef<"div", StepsProps>(
  ({ currentStep, startingIndex, children, ...props }, ref) => {
    return (
      <Box ref={ref} {...props}>
        {Children.toArray(children).map((page, i) => {
          return (
            <Box key={i} display={i + (startingIndex ?? 0) === currentStep ? "block" : "none"}>
              {page}
            </Box>
          );
        })}
      </Box>
    );
  }
);
