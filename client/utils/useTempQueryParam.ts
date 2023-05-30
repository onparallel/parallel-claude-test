import { useRouter } from "next/router";
import { useRef } from "react";
import { isDefined, omit } from "remeda";
import { MaybePromise } from "./types";
import { useAsyncEffect } from "./useAsyncEffect";
import { useUpdatingRef } from "./useUpdatingRef";

export function useTempQueryParam(
  paramName: string,
  effect: (value: string) => MaybePromise<boolean | undefined | void>
) {
  const routerRef = useUpdatingRef(useRouter());
  useAsyncEffect(async (isMounted) => {
    const { query, pathname } = routerRef.current;
    if (isDefined(query[paramName])) {
      const result = await effect(query[paramName] as string);
      if (isMounted() && result !== false) {
        routerRef.current.replace(
          {
            pathname: pathname,
            query: omit(routerRef.current.query, [paramName]),
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, []);
}
