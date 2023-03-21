import { PetitionLocale, UserLocale } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { IntlShape, useIntl } from "react-intl";

interface Locale<T extends string> {
  key: T;
  label: string;
  localizedLabel: (intl: IntlShape) => string;
}

const USER_LOCALES: Locale<UserLocale>[] = [
  {
    key: "en",
    label: "English",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "supported-locales.english",
        defaultMessage: "English",
      }),
  },
  {
    key: "es",
    label: "Español",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "supported-locales.spanish",
        defaultMessage: "Spanish",
      }),
  },
];

export function useSupportedUserLocales() {
  const intl = useIntl();
  return useMemo(
    () =>
      USER_LOCALES.map(({ key, label, localizedLabel }) => ({
        key,
        label,
        localizedLabel: localizedLabel(intl),
      })),
    [intl.locale]
  );
}

export function asSupportedUserLocale(locale: string): UserLocale {
  if (USER_LOCALES.some((l) => l.key === locale)) {
    return locale as UserLocale;
  } else {
    return "en";
  }
}

const PETITION_LOCALES: Locale<PetitionLocale>[] = [
  {
    key: "en",
    label: "English",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "supported-locales.english",
        defaultMessage: "English",
      }),
  },
  {
    key: "es",
    label: "Español",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "supported-locales.spanish",
        defaultMessage: "Spanish",
      }),
  },
];

export function useSupportedPetitionLocales() {
  const intl = useIntl();
  return useMemo(
    () =>
      PETITION_LOCALES.map(({ key, label, localizedLabel }) => ({
        key,
        label,
        localizedLabel: localizedLabel(intl),
      })),
    [intl.locale]
  );
}
