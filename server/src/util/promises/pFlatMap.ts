import pMap from "p-map";

export async function pFlatMap<Element, NewElement>(
  input: Iterable<Element>,
  mapper: pMap.Mapper<Element, NewElement[]>,
  options?: pMap.Options
): Promise<NewElement[]> {
  return (await pMap(input, mapper, options)).flat();
}
