import { useState } from "react";
import { useAsyncEffect } from "./useAsyncEffect";

const PROMISE_CACHE: Record<string, Promise<any>> = {};
const DATA_CACHE: Record<string, Record<string, string>> = {};

export function useLoadCountryNames(locale: string) {
  const [data, setData] = useState<{
    countries: Record<string, string> | null;
    loading: boolean;
  }>({
    countries: null,
    loading: true,
  });

  useAsyncEffect(
    async (isMounted) => {
      if (DATA_CACHE[locale]) {
        setData({ countries: DATA_CACHE[locale], loading: false });
      } else {
        if (!data.loading) {
          setData({ countries: null, loading: true });
        }
      }
      const url = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/countries/countries_${locale}.json`;
      const promise =
        PROMISE_CACHE[locale] ??
        (PROMISE_CACHE[locale] = fetch(url).then((response) => response.json()));
      await promise
        .then((data) => {
          DATA_CACHE[locale] = data;
          if (isMounted()) {
            setData({ countries: data, loading: false });
          }
        })
        .catch();
    },
    [locale]
  );

  return data;
}
