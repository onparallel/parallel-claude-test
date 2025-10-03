import countriesEn from "../../../data/countries/countries_en.json";
import countriesEs from "../../../data/countries/countries_es.json";

export const OTHER_COUNTRIES: Record<string, Record<string, string>> = {
  en: {
    zz: "Global",
    eu: "European Union",
    zr: "Zaire",
    dd: "East Germany",
    yucs: "Yugoslavia",
    csxx: "Serbia and Montenegro",
    cshh: "Czechoslovakia",
    suhh: "Soviet Union",
    "ge-ab": "Abkhazia (Occupied Georgia)",
    "x-so": "South Ossetia (Occupied Georgia)",
    "ua-lpr": "Luhansk (Occupied Ukraine)",
    "ua-dpr": "Donetsk (Occupied Ukraine)",
    "ua-cri": "Crimea (Occupied Ukraine)",
    "so-som": "Somaliland",
    "cy-trnc": "Northern Cyprus",
    "az-nk": "Nagorno-Karabakh",
    "cn-xz": "Tibet",
    "gg-srk": "Sark",
    "gb-wls": "Wales",
    "gb-sct": "Scotland",
    "gb-nir": "Northern Ireland",
    "md-pmr": "Transnistria (PMR)",
  },
  es: {
    zz: "Global",
    eu: "Unión Europea",
    zr: "Zaire",
    dd: "Alemania Oriental",
    yucs: "Yugoslavia",
    csxx: "Serbia y Montenegro",
    cshh: "Checoslovaquia",
    suhh: "Unión Soviética",
    "ge-ab": "Abjasia (Georgia ocupada)",
    "x-so": "Osetia del Sur (Georgia ocupada)",
    "ua-lpr": "Luhansk (Ucrania ocupada)",
    "ua-dpr": "Donetsk (Ucrania ocupada)",
    "ua-cri": "Crimea (Ucrania ocupada)",
    "so-som": "Somalilandia",
    "cy-trnc": "Chipre del Norte",
    "az-nk": "Nagorno-Karabaj",
    "cn-xz": "Tíbet",
    "gg-srk": "Sark",
    "gb-wls": "Gales",
    "gb-sct": "Escocia",
    "gb-nir": "Irlanda del Norte",
    "md-pmr": "Transnistria (PMR)",
  },
};

export const getCountryName = (code: string, locale: string) => {
  const countries = locale === "es" ? countriesEs : countriesEn;

  return (
    countries[code.toUpperCase() as keyof typeof countries] ??
    OTHER_COUNTRIES[locale][code.toLowerCase()] ??
    code
  );
};
