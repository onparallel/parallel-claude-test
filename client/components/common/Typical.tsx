import { type, TypicalArg } from "@camwiegert/typical";
import { BoxProps, Box } from "@chakra-ui/core";
import { useEffect, useRef, forwardRef } from "react";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";

export type PublicHeroProps = BoxProps;

export const Typical = forwardRef<
  HTMLElement,
  { args: TypicalArg[] } & BoxProps
>(function ({ args, ...props }, ref) {
  const elementRef = useRef<HTMLElement>();
  useEffect(() => {
    let alive = true;
    async function check() {
      if (!alive) {
        throw new Error();
      }
    }
    type(
      elementRef.current!,
      ...args.flatMap((arg) => [check, arg]),
      type
    ).catch(() => {});
    return () => {
      alive = false;
    };
  }, [JSON.stringify(args)]);
  return <Box {...props} ref={useMergeRefs(elementRef, ref)} />;
});
