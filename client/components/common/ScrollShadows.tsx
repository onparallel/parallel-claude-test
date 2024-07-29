import { Box, useSafeLayoutEffect } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import useMergedRef from "@react-hook/merged-ref";
import { useRef } from "react";
import useResizeObserver from "@react-hook/resize-observer";

export const ScrollShadows = chakraForwardRef<
  "div",
  { size?: number; direction?: "horizontal" | "vertical" }
>(function ScrollShadows({ children, direction = "vertical", size = 40, ...props }, ref) {
  const innerRef = useRef<HTMLDivElement>(null);
  const _ref = useMergedRef(ref, innerRef);
  const scrollRef = useRef<[boolean | null, boolean | null]>([null, null]);

  const checkScroll = direction === "horizontal" ? checkScrollHorizontal : checkScrollVertical;

  useResizeObserver(innerRef, checkScroll);
  useSafeLayoutEffect(() => {
    innerRef.current!.addEventListener("scroll", checkScroll);
    return () => {
      const element = innerRef.current;
      element?.removeEventListener("scroll", checkScroll);
      if (direction === "horizontal") {
        element?.removeAttribute("data-scroll-start");
        element?.removeAttribute("data-scroll-end");
      } else {
        element?.removeAttribute("data-scroll-top");
        element?.removeAttribute("data-scroll-bottom");
      }
    };
  }, [direction]);

  function checkScrollVertical() {
    const element = innerRef.current!;
    const [prevTop, prevBottom] = scrollRef.current!;
    const isTop = element.scrollTop === 0;
    const isBottom = element.scrollTop + element.clientHeight >= element.scrollHeight;
    if (prevTop !== isTop) {
      element.setAttribute("data-scroll-top", `${isTop}`);
      scrollRef.current[0] = isTop;
    }
    if (prevBottom !== isBottom) {
      element.setAttribute("data-scroll-bottom", `${isBottom}`);
      scrollRef.current[1] = isBottom;
    }
  }

  function checkScrollHorizontal() {
    const element = innerRef.current!;
    const [prevStart, prevEnd] = scrollRef.current!;
    const isStart = element.scrollLeft === 0;
    const isEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth;

    if (prevStart !== isStart) {
      element.setAttribute("data-scroll-start", `${isStart}`);
      scrollRef.current[0] = isStart;
    }
    if (prevEnd !== isEnd) {
      element.setAttribute("data-scroll-end", `${isEnd}`);
      scrollRef.current[1] = isEnd;
    }
  }

  return (
    <Box
      ref={_ref}
      {...props}
      sx={{
        ...props.sx,
        "--scroll-shadow-size": `${size}px`,
        ...(direction === "horizontal"
          ? {
              '&[data-scroll-start="false"]': {
                maskImage:
                  "linear-gradient(to right, transparent 0%, #000 var(--scroll-shadow-size));",
              },
              '&[data-scroll-end="false"]': {
                maskImage:
                  "linear-gradient(to left,transparent 0%, #000 var(--scroll-shadow-size));",
              },
              '&[data-scroll-start="false"][data-scroll-end="false"]': {
                maskImage:
                  "linear-gradient(90deg,#000,transparent 0,#000 var(--scroll-shadow-size),#000 calc(100% - var(--scroll-shadow-size)),transparent);",
              },
            }
          : {
              '&[data-scroll-top="false"]': {
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 var(--scroll-shadow-size));",
              },
              '&[data-scroll-bottom="false"]': {
                maskImage:
                  "linear-gradient(to top, transparent 0%, #000 var(--scroll-shadow-size));",
              },
              '&[data-scroll-top="false"][data-scroll-bottom="false"]': {
                maskImage:
                  "linear-gradient(#000,transparent 0,#000 var(--scroll-shadow-size),#000 calc(100% - var(--scroll-shadow-size)),transparent);",
              },
            }),
      }}
    >
      {children}
    </Box>
  );
});
