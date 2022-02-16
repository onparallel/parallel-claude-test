import { useEffect, useState } from "react";

export function useLoadCountryNames(locale: string): {
  countries: Record<string, string> | null;
  loading: boolean;
} {
  const [countries, setCountries] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/lang/country/country_${locale}.json`)
      .then((response) => response.json())
      .then((data) => {
        setCountries(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [locale]);

  return {
    countries,
    loading: countries === null,
  };
}
