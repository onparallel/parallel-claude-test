import { chakraComponent } from "@parallel/chakra/utils";
import { useLiquid } from "@parallel/utils/liquid/useLiquid";
import { Box } from "@parallel/components/ui";
import { MarkdownRender } from "./MarkdownRender";

export const FieldDescription = chakraComponent<"div", { description?: string }>(
  function FieldDescription({ ref, description, ...props }) {
    const interpolated = useLiquid(description ?? "");
    return (
      <Box ref={ref} whiteSpace="pre-wrap" {...props}>
        <MarkdownRender markdown={interpolated} />
      </Box>
    );
  },
);
