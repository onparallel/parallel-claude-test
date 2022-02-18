import { useEffect, useState } from "react";

export function useLoadCountryNames(locale: string): {
  countries: Record<string, string> | null;
  loading: boolean;
} {
  const [data, setData] = useState({
    countries: null,
    loading: true,
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/lang/country/country_${locale}.json`)
      .then((response) => response.json())
      .then((data) => {
        setData({ countries: data, loading: false });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [locale]);

  return data;
}
