import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useFormatPlacehoders(format: string): string | undefined {
  const intl = useIntl();
  return useMemo(() => {
    const placeholders = {
      DNI: intl.formatMessage({
        id: "component.format-placeholder.dni-nie",
        defaultMessage: "E.g., 12345678A",
      }),
      CIF: intl.formatMessage({
        id: "component.format-placeholder.cif",
        defaultMessage: "E.g., B76365789",
      }),
      IBAN: intl.formatMessage({
        id: "component.format-placeholder.iban",
        defaultMessage: "E.g., GB33 BUKB 2020 1555 5555 55",
      }),
      SSN_SPAIN: intl.formatMessage({
        id: "component.format-placeholder.ssn-spain",
        defaultMessage: "E.g., 08 11621612 13",
      }),
      SSN_USA: intl.formatMessage({
        id: "component.format-placeholder.ssn-usa",
        defaultMessage: "E.g., 504-88-5752",
      }),
      POSTAL_SPAIN: intl.formatMessage({
        id: "component.format-placeholder.postal-spain",
        defaultMessage: "E.g., 08001",
      }),
      POSTAL_USA: intl.formatMessage({
        id: "component.format-placeholder.postal-usa",
        defaultMessage: "E.g., 99301",
      }),
    } as Record<string, string>;

    return placeholders[format];
  }, [intl.locale, format]);
}
