import pMap, { Options as PMapOptions } from "p-map";
import { chunk, omit } from "remeda";
import { UnwrapArray } from "../types";
import { pFlatMap } from "./pFlatMap";

export interface PMapChunkOptions extends PMapOptions {
  chunkSize: number;
}

export async function pMapChunk<Element, NewElements extends any[] | void>(
  input: Iterable<Element>,
  mapper: pMap.Mapper<Element[], NewElements>,
  options: PMapChunkOptions,
): Promise<NewElements extends any[] ? UnwrapArray<NewElements>[] : undefined[]> {
  return pFlatMap(
    chunk(Array.from(input), options.chunkSize),
    mapper,
    omit(options, ["chunkSize"]),
  );
}
