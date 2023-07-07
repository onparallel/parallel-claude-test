import pMap from "p-map";
import { UnwrapArray } from "../types";

export async function pFlatMap<Element, NewElements extends any[] | void>(
  input: Iterable<Element>,
  mapper: pMap.Mapper<Element, NewElements>,
  options?: pMap.Options,
): Promise<NewElements extends any[] ? UnwrapArray<NewElements>[] : undefined[]> {
  return ((await pMap(input, mapper, options)) as any).flat();
}
