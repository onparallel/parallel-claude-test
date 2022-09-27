import { useRouter } from "next/router";
import { useEffect } from "react";
import { isDefined, omit } from "remeda";

export function useTempQueryParam(paramName: string, effect: (value: string) => void) {
  const router = useRouter();
  useEffect(() => {
    if (isDefined(router.query[paramName])) {
      effect(router.query[paramName] as string);
      router.replace(
        {
          pathname: router.pathname,
          query: omit(router.query, [paramName]),
        },
        undefined,
        { shallow: true }
      );
    }
  }, []);
}
