import { type, TypicalArg } from "@camwiegert/typical";
import { Box } from "@chakra-ui/core";
import { useEffect, useRef, forwardRef } from "react";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { ExtendChakra } from "@parallel/chakra/utils";

export const Typical = forwardRef<
  HTMLElement,
  ExtendChakra<{ args: TypicalArg[] }>
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
