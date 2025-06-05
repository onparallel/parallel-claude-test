import { Box } from "@chakra-ui/react";
import { Collapsible, CollapsibleRootProps } from "../ui";

export function PaddedCollapse({ children, ...props }: CollapsibleRootProps) {
  return (
    <Box>
      <Box margin={-1}>
        <Collapsible.Root {...props}>
          <Collapsible.Content>
            <Box padding={1}>{children as any}</Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    </Box>
  );
}
