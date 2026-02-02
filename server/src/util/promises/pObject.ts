import pMap from "p-map";
import { entries, fromEntries } from "remeda";

type ObjectMapper<Element = any, NewElement = unknown> = (
  element: Element,
  key: string,
) => Promise<NewElement>;

interface PObjectOptions extends pMap.Options {}

export async function pObject<T extends Record<string, any>, NewElement>(
  input: T,
  mapper: ObjectMapper<T[keyof T], NewElement>,
  options?: PObjectOptions,
): Promise<{ [K in keyof T]: NewElement }> {
  return fromEntries(
    await pMap(entries(input), async ([key, value]) => [key, await mapper(value, key)], options),
  ) as { [K in keyof T]: NewElement };
}
