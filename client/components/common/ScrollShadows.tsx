import { Box, useSafeLayoutEffect } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import useMergedRef from "@react-hook/merged-ref";
import { useRef } from "react";
import useResizeObserver from "@react-hook/resize-observer";

export const ScrollShadows = chakraForwardRef<"div", { size?: number }>(function ScrollShadows(
  { children, size = 40, ...props },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  const _ref = useMergedRef(ref, innerRef);
  const scrollRef = useRef<[boolean | null, boolean | null]>([null, null]);

  useResizeObserver(innerRef, checkScroll);
  useSafeLayoutEffect(() => {
    innerRef.current!.addEventListener("scroll", checkScroll);
    return () => {
      const element = innerRef.current;
      element?.removeEventListener("scroll", checkScroll);
      element?.removeAttribute("data-scroll-top");
      element?.removeAttribute("data-scroll-bottom");
    };
  }, []);

  function checkScroll() {
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

  return (
    <Box
      ref={_ref}
      {...props}
      sx={{
        ...props.sx,
        "--scroll-shadow-size": `${size}px`,
        '&[data-scroll-top="false"]': {
          maskImage: "linear-gradient(#000,#000,transparent 0,#000 var(--scroll-shadow-size));",
        },
        '&[data-scroll-bottom="false"]': {
          maskImage:
            "linear-gradient(180deg,#000 calc(100% - var(--scroll-shadow-size)),transparent)",
        },
        '&[data-scroll-top="false"][data-scroll-bottom="false"]': {
          maskImage:
            "linear-gradient(#000,#000,transparent 0,#000 var(--scroll-shadow-size),#000 calc(100% - var(--scroll-shadow-size)),transparent);",
        },
      }}
    >
      {children}
    </Box>
  );
});
