import { Stack, StackProps } from "@chakra-ui/react";
import { forwardRef } from "react";

export const PaddedStack = forwardRef<HTMLDivElement, StackProps>(
  ({ children, ...props }, ref) => {
    return (
      <Stack margin={-1} padding={1} ref={ref} {...props}>
        {children}
      </Stack>
    );
  }
);
