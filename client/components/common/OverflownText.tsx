import { assignRef, Box, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import useMergedRef from "@react-hook/merged-ref";
import useResizeObserver from "@react-hook/resize-observer";
import { ReactNode, useRef, useState } from "react";

export interface OverflownTextProps {
  children: ReactNode;
}

export const OverflownText = chakraForwardRef<"div", OverflownTextProps>(function OverflownText(
  { children, ...props },
  ref,
) {
  const innerRef = useRef<HTMLElement>(null);
  const _ref = useMergedRef(innerRef, ref);
  const [isOverflown, setIsOverflown] = useState(false);
  // avoid unnecessary rerenders or listener changes
  const isOverflownRef = useRef(isOverflown);
  assignRef(isOverflownRef, isOverflown);
  useResizeObserver(innerRef, ({ target }) => {
    const _isOverflown = target.scrollWidth > target.clientWidth;
    if (_isOverflown !== isOverflownRef.current) {
      setIsOverflown(_isOverflown);
    }
  });

  return (
    <Tooltip label={children} isDisabled={!children || !isOverflown}>
      <Box
        position="relative"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        ref={_ref}
        {...props}
      >
        {children}
      </Box>
    </Tooltip>
  );
});
