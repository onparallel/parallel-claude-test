import pMap from "p-map";

export async function pFilter<Element>(
  input: Iterable<Element>,
  mapper: pMap.Mapper<Element, boolean>,
  options?: pMap.Options,
): Promise<Element[]> {
  return (
    await pMap(
      input,
      async (element, index) => [element, await mapper(element, index)] as const,
      options,
    )
  )
    .filter(([, result]) => result)
    .map(([element]) => element);
}
