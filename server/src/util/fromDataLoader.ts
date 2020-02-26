import DataLoader from "dataloader";

export interface FromDataLoaderOptions {
  refresh?: boolean;
}

export interface Loader<K, V> {
  (id: K, opts?: FromDataLoaderOptions): Promise<V>;
  (ids: K[], opts?: FromDataLoaderOptions): Promise<Array<V>>;
}

export function fromDataLoader<K, V, C = K>(
  dataloader: DataLoader<K, V, C>
): Loader<K, V> {
  return <any>async function(ids: K | K[], opts: FromDataLoaderOptions = {}) {
    const { refresh } = {
      refresh: false,
      ...opts
    };
    if (refresh) {
      for (const id of Array.isArray(ids) ? ids : [ids]) {
        dataloader.clear(id);
      }
    }
    return Array.isArray(ids)
      ? await dataloader.loadMany(ids)
      : await dataloader.load(ids);
  };
}
