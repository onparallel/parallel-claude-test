import { Box, Collapse, CollapseProps } from "@chakra-ui/react";

export function PaddedCollapse({ children, ...props }: CollapseProps) {
  return (
    <Box>
      <Box margin={-1}>
        <Collapse {...props}>
          <Box padding={1}>{children}</Box>
        </Collapse>
      </Box>
    </Box>
  );
}
