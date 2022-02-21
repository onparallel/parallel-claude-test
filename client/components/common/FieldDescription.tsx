import { Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useLiquid } from "@parallel/utils/useLiquid";
import { BreakLines } from "./BreakLines";
import { Linkify } from "./Linkify";

export const FieldDescription = chakraForwardRef<
  "p",
  { description?: string | null; linkify?: boolean }
>(function FieldDescription({ description, linkify, ...props }, ref) {
  const interpolated = useLiquid(description ?? "");
  return (
    <Text ref={ref} {...props}>
      {linkify ? (
        <Linkify>
          <BreakLines>{interpolated}</BreakLines>
        </Linkify>
      ) : (
        <BreakLines>{interpolated}</BreakLines>
      )}
    </Text>
  );
});
