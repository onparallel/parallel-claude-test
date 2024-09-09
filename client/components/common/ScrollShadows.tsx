import { Box, useSafeLayoutEffect } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { scrollBarSize } from "@parallel/utils/scrollBarSize";
import useMergedRef from "@react-hook/merged-ref";
import useResizeObserver from "@react-hook/resize-observer";
import { useCallback, useRef } from "react";
import { fromEntries } from "remeda";

interface ScrollShadowsProps {
  size?: number;
  direction?: "horizontal" | "vertical" | "both";
  shadowTop?: boolean;
  shadowBottom?: boolean;
  shadowStart?: boolean;
  shadowEnd?: boolean;
}

export const ScrollShadows = chakraForwardRef<"div", ScrollShadowsProps>(function ScrollShadows(
  {
    children,
    direction = "vertical",
    size = 40,
    shadowTop = true,
    shadowBottom = true,
    shadowStart = true,
    shadowEnd = true,
    ...props
  },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  const _ref = useMergedRef(ref, innerRef);
  const scrollRef = useRef<Record<"top" | "end" | "bottom" | "start", boolean | null>>({
    top: null,
    end: null,
    bottom: null,
    start: null,
  });

  const checkScroll = useCallback(() => {
    const element = innerRef.current!;
    const { top: prevTop, end: prevEnd, bottom: prevBottom, start: prevStart } = scrollRef.current!;
    const isTop = element.scrollTop === 0;
    const isBottom = element.scrollTop + element.clientHeight >= element.scrollHeight;
    element.setAttribute(
      "data-scroll-bar-vertical",
      `${element.scrollHeight >= element.offsetHeight}`,
    );
    if ((direction === "vertical" || direction === "both") && (!isTop || !isBottom)) {
      if (prevTop !== isTop) {
        if (shadowTop) {
          element.setAttribute("data-scroll-top", `${isTop}`);
        }
        scrollRef.current.top = isTop;
      }
      if (prevBottom !== isBottom) {
        if (shadowBottom) {
          element.setAttribute("data-scroll-bottom", `${isBottom}`);
        }
        scrollRef.current.bottom = isBottom;
      }
    } else {
      element.removeAttribute("data-scroll-top");
      element.removeAttribute("data-scroll-bottom");
    }
    const isStart = element.scrollLeft === 0;
    const isEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth;
    element.setAttribute(
      "data-scroll-bar-horizontal",
      `${element.scrollWidth >= element.offsetWidth}`,
    );
    if ((direction === "horizontal" || direction === "both") && (!isStart || !isEnd)) {
      if (prevStart !== isStart) {
        if (shadowStart) {
          element.setAttribute("data-scroll-start", `${isStart}`);
        }
        scrollRef.current.start = isStart;
      }
      if (prevEnd !== isEnd) {
        if (shadowEnd) {
          element.setAttribute("data-scroll-end", `${isEnd}`);
        }
        scrollRef.current.end = isEnd;
      }
    } else {
      element.removeAttribute("data-scroll-start");
      element.removeAttribute("data-scroll-end");
    }
  }, [direction]);

  useResizeObserver(innerRef, checkScroll);
  useSafeLayoutEffect(() => {
    innerRef.current!.addEventListener("scroll", checkScroll);
    return () => {
      const element = innerRef.current;
      element?.removeEventListener("scroll", checkScroll);
      element?.removeAttribute("data-scroll-start");
      element?.removeAttribute("data-scroll-end");
      element?.removeAttribute("data-scroll-top");
      element?.removeAttribute("data-scroll-bottom");
      element?.removeAttribute("data-scroll-bar-vertical");
      element?.removeAttribute("data-scroll-bar-horizontal");
    };
  }, [direction]);

  return (
    <Box
      ref={_ref}
      {...props}
      sx={{
        ...props.sx,
        "--scroll-shadow-size": `${size}px`,
        "--scroll-shadow-start":
          "linear-gradient(to right, transparent 0%, #000 var(--scroll-shadow-size))",
        "--scroll-shadow-end":
          "linear-gradient(to left,transparent 0%, #000 var(--scroll-shadow-size))",
        "--scroll-shadow-top":
          "linear-gradient(to bottom, transparent 0%, #000 var(--scroll-shadow-size))",
        "--scroll-shadow-bottom":
          "linear-gradient(to top, transparent 0%, #000 var(--scroll-shadow-size))",
        "--scroll-shadow-end-scroll-bar": `linear-gradient(to left, #000 0%, #000 ${scrollBarSize()}px, transparent ${scrollBarSize()}px, #000 var(--scroll-shadow-size))`,
        "--scroll-shadow-bottom-scroll-bar": `linear-gradient(to top, #000 0%, #000 ${scrollBarSize()}px, transparent ${scrollBarSize()}px, #000 var(--scroll-shadow-size))`,
        maskComposite: "intersect",
        ...fromEntries(
          combinations.flatMap((sides) => {
            // when showing bottom or end shadow we must account for possible scrollbars
            if (sides.includes("bottom") || sides.includes("end")) {
              return [false, true].flatMap((scrollBarVertical) =>
                [false, true]
                  .map((scrollBarHorizontal) => [scrollBarVertical, scrollBarHorizontal] as const)
                  .map(
                    ([scrollBarVertical, scrollBarHorizontal]) =>
                      [
                        "&" +
                          (scrollBarVertical ? `[data-scroll-bar-vertical="true"]` : "") +
                          (scrollBarHorizontal ? `[data-scroll-bar-horizontal="true"]` : "") +
                          sides.map((s) => `[data-scroll-${s}="false"]`).join(""),
                        {
                          maskImage: sides
                            .map((s) => {
                              if (
                                (s === "bottom" && scrollBarHorizontal) ||
                                (s === "end" && scrollBarVertical)
                              ) {
                                return `var(--scroll-shadow-${s}-scroll-bar)`;
                              }
                              return `var(--scroll-shadow-${s})`;
                            })
                            .join(", "),
                        },
                      ] as const,
                  ),
              );
            }
            return [
              [
                "&" + sides.map((s) => `[data-scroll-${s}="false"]`).join(""),
                {
                  maskImage: sides.map((s) => `var(--scroll-shadow-${s})`).join(", "),
                },
              ] as const,
            ];
          }),
        ),
      }}
    >
      {children}
    </Box>
  );
});

const combinations = [
  ["start"],
  ["end"],
  ["top"],
  ["bottom"],
  ["start", "end"],
  ["start", "top"],
  ["start", "bottom"],
  ["end", "top"],
  ["end", "bottom"],
  ["top", "bottom"],
  ["start", "end", "top"],
  ["start", "end", "bottom"],
  ["start", "top", "bottom"],
  ["end", "top", "bottom"],
  ["start", "end", "top", "bottom"],
] satisfies ("start" | "end" | "top" | "bottom")[][];
