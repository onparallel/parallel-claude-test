import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useLiquid } from "@parallel/utils/liquid/useLiquid";
import { MarkdownRender } from "./MarkdownRender";

export const FieldDescription = chakraForwardRef<"div", { description?: string }>(
  function FieldDescription({ description, ...props }, ref) {
    const interpolated = useLiquid(description ?? "");
    return (
      <Box ref={ref} whiteSpace="pre-wrap" {...props}>
        <MarkdownRender markdown={interpolated} />;
      </Box>
    );
  },
);
