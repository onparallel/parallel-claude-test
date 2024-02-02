import { useState } from "react";
import { useAsyncEffect } from "./useAsyncEffect";

const PROMISE_CACHE: Record<string, Promise<any> | undefined> = {};
const DATA_CACHE: Record<string, CountryNameDict | undefined> = {};

type CountryName = string | [name: string, alias: string];
interface CountryNameDict {
  [code: string]: CountryName;
}

export function useLoadCountryNames(locale: string) {
  const [data, setData] = useState({
    locale,
    countries: null as CountryNameDict | null,
    loading: true,
  });

  useAsyncEffect(
    async (isMounted) => {
      const fromCache = DATA_CACHE[locale];
      if (fromCache) {
        setData({ countries: fromCache, loading: false, locale });
      } else {
        if (!data.loading) {
          setData({ countries: null, loading: true, locale });
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
            setData({ countries: data, loading: false, locale });
          }
        })
        .catch();
    },
    [locale],
  );

  return data;
}
