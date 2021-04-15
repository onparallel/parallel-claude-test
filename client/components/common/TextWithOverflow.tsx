import { Box, BoxProps } from "@chakra-ui/layout";
import { Tooltip } from "@chakra-ui/tooltip";
import { useEffect, useRef, useState } from "react";

interface TextWithOverflowProps extends BoxProps {
  tooltipText?: string | null;
}
export function TextWithOverflow({
  tooltipText,
  children,
}: TextWithOverflowProps) {
  const ref = useRef<HTMLElement>(null);
  const [isOverflown, setIsOverflown] = useState(false);
  useEffect(() => {
    setIsOverflown(ref.current!.scrollWidth > ref.current!.clientWidth);
  }, []);

  return (
    <Tooltip label={tooltipText} isDisabled={!tooltipText || !isOverflown}>
      <Box isTruncated ref={ref as any}>
        {children}
      </Box>
    </Tooltip>
  );
}
