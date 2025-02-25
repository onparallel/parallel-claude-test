import DataLoader from "dataloader";
import { Pagination } from "../db/helpers/BaseRepository";
import { LazyPromise } from "./promises/LazyPromise";
import { Prettify } from "./types";

type PaginationKey = Prettify<keyof Pagination<any>>;

type ResolvedPagination<T> = { [K in PaginationKey]: Awaited<Pagination<T>[K]> };

export function paginationLoader<TResult, TParams>(
  loader: (
    params: TParams,
    selection: { [K in PaginationKey]: boolean },
  ) => Promise<Partial<ResolvedPagination<TResult>>>,
): (params: TParams) => Pagination<TResult> {
  return (params) => {
    const dataloader = new DataLoader<
      PaginationKey,
      Pick<ResolvedPagination<TResult>, PaginationKey>
    >(async (keys) => {
      const result = await loader(params, {
        items: keys.includes("items"),
        totalCount: keys.includes("totalCount"),
      });
      return keys.map(
        (key) => ({ [key]: result[key]! }) as Pick<ResolvedPagination<TResult>, PaginationKey>,
      );
    });
    return {
      items: LazyPromise.from(async () => {
        return (await dataloader.load("items")).items;
      }),
      totalCount: LazyPromise.from(async () => {
        return (await dataloader.load("totalCount")).totalCount;
      }),
    };
  };
}
