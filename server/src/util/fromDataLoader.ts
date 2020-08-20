import DataLoader from "dataloader";

export interface FromDataLoaderOptions {
  cache?: boolean;
  refresh?: boolean;
}

export interface Loader<K, V> {
  (id: K, opts?: FromDataLoaderOptions): Promise<V>;
  (ids: K[], opts?: FromDataLoaderOptions): Promise<Array<V>>;
  dataloader: DataLoader<K, V>;
}

export function fromDataLoader<K, V, C = K>(
  dataloader: DataLoader<K, V, C>
): Loader<K, V> {
  return Object.assign(
    async function (ids: K | K[], opts: FromDataLoaderOptions = {}) {
      const { refresh, cache } = {
        refresh: false,
        cache: true,
        ...opts,
      };
      if (refresh || !cache) {
        for (const id of Array.isArray(ids) ? ids : [ids]) {
          dataloader.clear(id);
        }
      }
      const result = Array.isArray(ids)
        ? await dataloader.loadMany(ids)
        : await dataloader.load(ids);
      if (!cache) {
        for (const id of Array.isArray(ids) ? ids : [ids]) {
          dataloader.clear(id);
        }
      }
      return result;
    } as any,
    { dataloader }
  );
}
