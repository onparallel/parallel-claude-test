import pMap from "p-map";
import { isDefined } from "remeda";
import { MaybePromise } from "./types";

export async function validateObject<T extends {}>(
  object: T,
  validateKeys: {
    [K in keyof T]: (value: Exclude<T[K], null | undefined>) => MaybePromise<boolean>;
  },
  options?: pMap.Options
) {
  await pMap(
    Object.entries(validateKeys),
    async ([key, validator]) => {
      if (isDefined(object[key as keyof T])) {
        const valid: boolean = await (validator as any)(object[key as keyof T]);
        if (!valid) {
          throw new Error(`Invalid key: ${key}`);
        }
      }
    },
    options
  );
}
