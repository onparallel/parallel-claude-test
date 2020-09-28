import { MutationUpdaterFn } from "@apollo/client";

type DataProxy = Parameters<MutationUpdaterFn>[0];
export function clearCache(cache: DataProxy, regex: RegExp) {
  const store = (cache as any).data;
  const data = store.data as any;
  for (const key of Object.keys(data)) {
    if (["ROOT_QUERY", "ROOT_MUTATION"].includes(key)) {
      for (const subkey of Object.keys(data[key])) {
        if (subkey !== "__typename" && regex.test(`$${key}.${subkey}`)) {
          delete data[key][subkey];
        }
      }
    } else {
      if (regex.test(key)) {
        store.delete(key);
      }
    }
  }
}
