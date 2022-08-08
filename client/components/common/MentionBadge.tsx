import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";

interface MentionBadgeProps {
  mentionId: string;
  isHighlighted?: boolean;
  isFaded?: boolean;
}

export const MentionBadge = chakraForwardRef<"span", MentionBadgeProps>(function MentionBadge(
  { mentionId, isHighlighted, isFaded, ...props },
  ref
) {
  return (
    <Box
      ref={ref as any}
      as="span"
      data-mention-id={mentionId}
      display="inline-block"
      borderRadius="sm"
      paddingX={1}
      lineHeight="short"
      marginX="0.1em"
      fontWeight={isHighlighted ? "semibold" : "normal"}
      backgroundColor={isHighlighted ? "blue.100" : "gray.100"}
      color={isHighlighted ? "blue.800" : isFaded ? "gray.400" : "gray.700"}
      {...props}
    />
  );
});
