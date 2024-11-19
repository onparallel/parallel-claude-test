import { Box, PlacementWithLogical } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { assignRef } from "@parallel/utils/assignRef";
import useMergedRef from "@react-hook/merged-ref";
import useResizeObserver from "@react-hook/resize-observer";
import { ReactNode, useRef, useState } from "react";

export interface OverflownTextProps {
  children: ReactNode;
  placement?: PlacementWithLogical;
}

export const OverflownText = chakraForwardRef<"div", OverflownTextProps>(function OverflownText(
  { children, placement, ...props },
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
    <Tooltip placement={placement} label={children} isDisabled={!children || !isOverflown}>
      <Box whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" ref={_ref} {...props}>
        {children}
      </Box>
    </Tooltip>
  );
});
