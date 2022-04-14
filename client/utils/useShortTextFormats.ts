import { useMemo } from "react";
import { useIntl } from "react-intl";
import { isDefined, uniq } from "remeda";
import { ibanDefinitions, ibanRegex } from "./iban";
import { useLoadCountryNames } from "./useCountryName";
import { EMAIL_REGEX } from "./validation";

export type ShortTextFormat = ShortTextFormatImplementation & {
  value: string;
  label: string;
  example: string;
  country?: string;
  countryName?: string;
  inputProps?: any;
  validate?: (value: string) => boolean;
};

type ShortTextFormatImplementation =
  | { type: "INPUT" }
  | { type: "MASK"; maskProps: (value: string) => any };

const prepare = (str: string) => str.toUpperCase();

export function useShortTextFormats() {
  const intl = useIntl();
  return useMemo<ShortTextFormat[]>(
    () => [
      {
        value: "EMAIL",
        label: intl.formatMessage({
          id: "short-text-formats.email",
          defaultMessage: "email",
        }),
        example: intl.formatMessage({
          id: "generic.email-example",
          defaultMessage: "email@example.com",
        }),
        type: "INPUT",
        inputProps: { type: "email", autoComplete: "email", name: "email" },
        validate: (value) => EMAIL_REGEX.test(value),
      },
      {
        value: "IBAN",
        label: intl.formatMessage({
          id: "short-text-formats.iban",
          defaultMessage: "IBAN account number",
        }),
        example: "ES21 1465 0100 7220 3087 6293",
        type: "MASK",
        maskProps: (value) => {
          const defaultMask = {
            mask: "aa00 AAAA AAAA AAAA AAAA AAAA AAAA AAAA",
            definitions: { A: /[0-9A-Z]/ },
            prepare,
          };

          if (value.length > 1) {
            const match = ibanDefinitions.find(([country]) =>
              country.startsWith(value.slice(0, 2).toUpperCase())
            );

            if (match) {
              const [country, format] = match;
              let full = format.map(([pattern, repeats]) => pattern.repeat(repeats)).join("");
              let mask = `{${country}}00`;
              if (full) {
                while (full.length) {
                  mask += " " + full.slice(0, 4);
                  full = full.slice(4);
                }
              }

              return { mask, definitions: { A: /[0-9A-Z]/, F: /[0-9]/, U: /[A-Z]/ }, prepare };
            } else {
              return defaultMask;
            }
          } else {
            return defaultMask;
          }
        },
        validate: (value) => ibanRegex.test(value.replace(/\s/g, "")),
      },
      {
        value: "ES_DNI",
        label: intl.formatMessage({
          id: "short-text-formats.es-dni",
          defaultMessage: "national ID number",
        }),
        example: "12345678Z",
        country: "ES",
        type: "MASK",
        maskProps: () => ({
          mask: "#0000000a",
          definitions: { "#": /[KLMXYZ0-9]/ },
          prepare,
        }),
        validate: (value) => /^[KLMXYZ0-9]\d{7}[A-Z]$/.test(value),
      },
      {
        value: "ES_NIF",
        label: intl.formatMessage({
          id: "short-text-formats.es-nif",
          defaultMessage: "tax ID number",
        }),
        example: "J12345674",
        country: "ES",
        type: "MASK",
        maskProps: (value: string) => {
          if (value === "") {
            return {
              mask: "#0000000%",
              definitions: { "#": /[ABCDEFGHJUVPQRSNW]/, "%": /[A-Z0-9]/ },
              prepare,
            };
          }
          if (/^[ABCDEFGHJUV]/.test(value)) {
            return { mask: "#00000000", definitions: { "#": /[ABCDEFGHJUV]/ }, prepare };
          } else {
            return { mask: "#0000000a", definitions: { "#": /[PQRSNW]/ }, prepare };
          }
        },
        validate: (value) => /^([KLMXYZ]\d{7}[A-Z]|[ABCDEFGHJUV]\d{8})$/.test(value),
      },
      {
        value: "ES_SSN",
        label: intl.formatMessage({
          id: "short-text-formats.es-ssn",
          defaultMessage: "social security number",
        }),
        example: "28 12345678 40",
        country: "ES",
        type: "MASK",
        maskProps: () => ({ mask: "00 00000000 00" }),
        inputProps: { inputMode: "numeric" },
        validate: (value) => /^\d{2} \d{8} \d{2}$/.test(value),
      },
      {
        value: "US_SSN",
        label: intl.formatMessage({
          id: "short-text-formats.us-ssn",
          defaultMessage: "social security number",
        }),
        example: "078-05-1120",
        country: "US",
        type: "MASK",
        maskProps: () => ({ mask: "000-00-0000" }),
        inputProps: { inputMode: "numeric" },
        validate: (value) => /^\d{3}-\d{2}-\d{4}$/.test(value),
      },
      {
        value: "ES_POSTALCODE",
        label: intl.formatMessage({
          id: "short-text-formats.es-postalcode",
          defaultMessage: "postal code",
        }),
        example: "08018",
        country: "ES",
        type: "MASK",
        maskProps: () => ({ mask: "00000" }),
        inputProps: { inputMode: "numeric" },
        validate: (value) => /^\d{5}$/.test(value),
      },
      {
        value: "US_POSTALCODE",
        label: intl.formatMessage({
          id: "short-text-formats.us-postalcode",
          defaultMessage: "zip code",
        }),
        example: "20500",
        country: "US",
        type: "MASK",
        maskProps: () => ({ mask: "00000" }),
        inputProps: { inputMode: "numeric" },
        validate: (value) => /^\d{5}$/.test(value),
      },
    ],
    [intl.locale]
  );
}

export function useShortTextFormatsSelectOptions() {
  const intl = useIntl();
  const countryNames = useLoadCountryNames(intl.locale);
  const formats = useShortTextFormats();
  return useMemo(() => {
    if (countryNames.loading) {
      return { grouped: [], allFormats: [], loading: true };
    }
    const countries = uniq(formats.filter((f) => isDefined(f.country)).map((f) => f.country!))
      .map((code) => ({ countryCode: code, countryName: countryNames.countries![code] }))
      .sort((a, b) => a.countryName.localeCompare(b.countryName, intl.locale));
    const grouped = [
      {
        label: intl.formatMessage({
          id: "short-text-formats.group-generic",
          defaultMessage: "Generic",
        }),
        options: formats.filter((f) => !isDefined(f.country)),
      },
      ...countries.map((country) => ({
        label: country.countryName,
        options: formats
          .filter((f) => f.country === country.countryCode)
          .map((f) => ({ ...f, countryName: country.countryName })),
      })),
    ];
    const allFormats = grouped.flatMap((g) => g.options);
    return { grouped, allFormats, loading: false };
  }, [countryNames, formats]);
}
