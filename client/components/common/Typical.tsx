import { type, TypicalArg } from "@camwiegert/typical";
import { BoxProps, Text } from "@chakra-ui/core";
import { useEffect, useRef } from "react";

export type PublicHeroProps = BoxProps;

export function Typical({ args, ...props }: { args: TypicalArg[] } & BoxProps) {
  const ref = useRef<HTMLElement>();
  const alive = useRef(true);
  useEffect(() => {
    async function check() {
      if (!alive.current) {
        throw new Error();
      }
    }
    type(
      ref.current!,
      ...args.flatMap((arg) => [check, arg]),
      type
    ).catch(() => {});
    return () => {
      alive.current = false;
    };
  }, []);
  return <Text {...props} ref={ref} />;
}
