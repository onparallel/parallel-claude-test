import { assignRef, Box, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import useMergedRef from "@react-hook/merged-ref";
import { useEffect, useRef, useState } from "react";
import ResizeObserver from "react-resize-observer";

export interface OverflownTextProps {
  children: string;
}
export const OverflownText = chakraForwardRef<"div", OverflownTextProps>(function OverflownText(
  { children, ...props },
  ref
) {
  const innerRef = useRef<HTMLElement>(null);
  const _ref = useMergedRef(innerRef, ref);
  const [isOverflown, setIsOverflown] = useState(false);
  // avoid unnecessary rerenders or listener changes
  const isOverflownRef = useRef(isOverflown);
  assignRef(isOverflownRef, isOverflown);
  useEffect(() => {
    const element = innerRef.current!;
    setIsOverflown(element.scrollWidth > element.clientWidth);
  }, []);

  function handleResize() {
    const element = innerRef.current;
    if (!element) {
      return;
    }
    const _isOverflown = element.scrollWidth > element.clientWidth;
    // boolean xor
    if ((_isOverflown as any) ^ (isOverflown as any)) {
      setIsOverflown(_isOverflown);
    }
  }

  return (
    <Tooltip label={children} isDisabled={!children || !isOverflown}>
      <Box position="relative" isTruncated ref={_ref} {...props}>
        <ResizeObserver onResize={handleResize} />
        {children}
      </Box>
    </Tooltip>
  );
});
