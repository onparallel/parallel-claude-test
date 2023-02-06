import pMap, { Options as PMapOptions } from "p-map";
import { chunk, omit } from "remeda";
import { pFlatMap } from "./pFlatMap";

export interface PMapChunkOptions extends PMapOptions {
  chunkSize: number;
}

export async function pMapChunk<Element, NewElement>(
  input: Iterable<Element>,
  mapper: pMap.Mapper<Element[], NewElement[]>,
  options: PMapChunkOptions
): Promise<NewElement[]> {
  return pFlatMap(
    chunk(Array.from(input), options.chunkSize),
    mapper,
    omit(options, ["chunkSize"])
  );
}
