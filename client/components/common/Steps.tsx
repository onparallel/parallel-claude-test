import { Box } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { Children } from "react";

export interface StepsProps {
  currentStep: number;
}

export const Steps = chakraComponent<"div", StepsProps>(
  ({ ref, currentStep, children, ...props }) => {
    return (
      <Box ref={ref} {...props}>
        {Children.toArray(children).map((page, i) => {
          return (
            <Box key={i} display={i === currentStep ? "block" : "none"}>
              {page}
            </Box>
          );
        })}
      </Box>
    );
  },
);
