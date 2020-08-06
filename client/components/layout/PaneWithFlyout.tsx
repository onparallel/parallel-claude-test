import { Box, Flex } from "@chakra-ui/core";
import { Maybe } from "@parallel/utils/types";
import { ReactNode, useEffect, useRef, useState } from "react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import ResizeObserver from "react-resize-observer";

export type PaneWithFlyoutProps = {
  isActive: boolean;
  flyout: ReactNode;
  alignWith: Maybe<HTMLElement>;
  children: ReactNode;
};

export function PaneWithFlyout({
  isActive,
  flyout,
  alignWith,
  children,
}: PaneWithFlyoutProps) {
  const [flyoutOffset, setFlyoutOffset] = useState(0);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(positionFlyout, [isActive, alignWith]);
  useEffect(scrollFlyoutIntoView, [isActive, alignWith]);

  function positionFlyout() {
    if (!isActive || !alignWith || !flyoutRef.current) {
      setFlyoutOffset(0);
      return;
    }
    const {
      top: paneTop,
      height: paneHeight,
    } = paneRef.current!.getBoundingClientRect();
    const {
      height: alignWithHeight,
      top: alignWithTop,
    } = alignWith.getBoundingClientRect();
    const { height: flyoutHeight } = flyoutRef.current.getBoundingClientRect();
    const offset =
      alignWithTop - paneTop + alignWithHeight / 2 - flyoutHeight / 2;
    const maxOffset = paneHeight - flyoutHeight;
    setFlyoutOffset(Math.min(maxOffset, Math.max(0, offset)));
  }

  function scrollFlyoutIntoView() {
    if (isActive) {
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
    <Flex ref={paneRef} minHeight="100%">
      <Box
        flex="2"
        display={{ base: isActive ? "none" : "block", md: "block" }}
      >
        {children}
      </Box>
      <Box
        flex="1"
        display={{ base: isActive ? "block" : "none", md: "block" }}
      >
        {isActive ? (
          <Box
            ref={flyoutRef}
            marginTop={{ base: 0, md: `${flyoutOffset}px` }}
            transition="margin-top 200ms ease"
            position={{ base: "relative", md: "sticky" }}
            top={0}
          >
            <ResizeObserver onResize={positionFlyout} />
            {flyout}
          </Box>
        ) : null}
      </Box>
    </Flex>
  );
}
