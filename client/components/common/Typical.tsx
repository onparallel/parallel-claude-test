import { type, TypicalArg } from "@camwiegert/typical";
import { BoxProps, Box } from "@chakra-ui/core";
import { useEffect, useRef } from "react";

export type PublicHeroProps = BoxProps;

export function Typical({ args, ...props }: { args: TypicalArg[] } & BoxProps) {
  const ref = useRef<HTMLElement>();
  useEffect(() => {
    let alive = true;
    async function check() {
      if (!alive) {
        throw new Error();
      }
    }
    type(
      ref.current!,
      ...args.flatMap((arg) => [check, arg]),
      type
    ).catch(() => {});
    return () => {
      alive = false;
    };
  }, [JSON.stringify(args)]);
  return <Box {...props} ref={ref} />;
}
