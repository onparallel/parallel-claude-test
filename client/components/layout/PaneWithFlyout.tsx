import { Box, Flex, PositionProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Maybe } from "@parallel/utils/types";
import useMergedRef from "@react-hook/merged-ref";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import ResizeObserver from "react-resize-observer";
import { isDefined } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

interface BoundingClientRect {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

interface WithGetBoundingClientRect {
  getBoundingClientRect(): BoundingClientRect;
}

export interface PaneWithFlyoutProps {
  isFlyoutActive: boolean;
  flyout: ReactNode;
  alignWithRef: Maybe<RefObject<WithGetBoundingClientRect>>;
  top?: PositionProps["top"];
  children: ReactNode;
}

export const PaneWithFlyout = chakraForwardRef<"div", PaneWithFlyoutProps>(function PaneWithFlyout(
  { isFlyoutActive, flyout, alignWithRef, top = 0, children, ...props },
  ref
) {
  const [flyoutOffset, setFlyoutOffset] = useState(0);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const _paneRef = useMergedRef(ref, paneRef);

  useEffect(positionFlyout, [isFlyoutActive, alignWithRef]);
  useEffect(scrollFlyoutIntoView, [isFlyoutActive, alignWithRef]);

  function positionFlyout() {
    const alignWith = alignWithRef?.current;
    const flyout = flyoutRef.current;
    if (!isFlyoutActive || !isDefined(alignWith) || !isDefined(flyout)) {
      setFlyoutOffset(0);
      return;
    }
    const { top: paneTop, height: paneHeight } = paneRef.current!.getBoundingClientRect();
    const { height: alignWithHeight, top: alignWithTop } = alignWith.getBoundingClientRect();
    const { height: flyoutHeight } = flyout.getBoundingClientRect();
    const offset =
      flyoutHeight > alignWithHeight
        ? alignWithTop - paneTop + alignWithHeight / 2 - flyoutHeight / 2
        : alignWithTop - paneTop;
    const maxOffset = paneHeight - flyoutHeight;
    setFlyoutOffset(Math.min(maxOffset, Math.max(0, offset)));
  }

  function scrollFlyoutIntoView() {
    if (isFlyoutActive) {
      const timeout = setTimeout(() => {
        if (flyoutRef.current) {
          scrollIntoView(flyoutRef.current, {
            scrollMode: "if-needed",
            block: "nearest",
          });
        }
      }, 200);
      return () => clearTimeout(timeout);
    }
  }

  return (
    <Flex ref={_paneRef} minHeight="100%" {...props}>
      <Box flex="2" minWidth={0} display={{ base: isFlyoutActive ? "none" : "block", md: "block" }}>
        {children}
      </Box>
      <Box
        flex="1"
        minWidth={{ base: 0, sm: "320px" }}
        display={{ base: isFlyoutActive ? "block" : "none", md: "block" }}
      >
        {flyout ? (
          <Box
            ref={flyoutRef}
            marginTop={{ base: 0, md: `${flyoutOffset}px` }}
            transition="margin-top 200ms ease"
            position={{ base: "relative", md: "sticky" }}
            top={top}
          >
            <ResizeObserver onResize={positionFlyout} />
            {flyout}
          </Box>
        ) : null}
      </Box>
    </Flex>
  );
});
