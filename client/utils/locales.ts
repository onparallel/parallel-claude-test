/** no-recipient */
import { gql } from "@apollo/client";
import {
  PetitionLocale,
  UserLocale,
  useAvailablePetitionLocales_UserFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { IntlShape, useIntl } from "react-intl";

interface Locale<T extends string> {
  key: T;
  label: string;
  localizedLabel: (intl: IntlShape) => string;
  flag: string;
}

const USER_LOCALES: Locale<UserLocale>[] = [
  {
    key: "en",
    label: "English",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "generic.language-english",
        defaultMessage: "English",
      }),
    flag: "us",
  },
  {
    key: "es",
    label: "Español",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "generic.language-spanish",
        defaultMessage: "Spanish",
      }),
    flag: "es",
  },
];

export function useSupportedUserLocales() {
  const intl = useIntl();
  return useMemo(
    () =>
      USER_LOCALES.map(({ key, label, localizedLabel, flag }) => ({
        key,
        label,
        localizedLabel: localizedLabel(intl),
        flag,
      })),
    [intl.locale],
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
    key: "ca",
    label: "Català",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "generic.language-catalan",
        defaultMessage: "Catalan",
      }),
    flag: "ca",
  },
  {
    key: "en",
    label: "English",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "generic.language-english",
        defaultMessage: "English",
      }),
    flag: "us",
  },
  {
    key: "es",
    label: "Español",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "generic.language-spanish",
        defaultMessage: "Spanish",
      }),
    flag: "es",
  },
  {
    key: "it",
    label: "Italiano",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "generic.language-italian",
        defaultMessage: "Italian",
      }),
    flag: "it",
  },
  {
    key: "pt",
    label: "Português",
    localizedLabel: (intl) =>
      intl.formatMessage({
        id: "generic.language-portuguese",
        defaultMessage: "Portuguese",
      }),
    flag: "pt",
  },
];

export const SUPPORTED_PETITION_LOCALES = PETITION_LOCALES.map((l) => l.key);

export function useSupportedPetitionLocales() {
  const intl = useIntl();
  return useMemo(
    () =>
      PETITION_LOCALES.map(({ key, label, localizedLabel }) => ({
        key,
        label,
        localizedLabel: localizedLabel(intl),
      })),
    [intl.locale],
  );
}

export function useAvailablePetitionLocales(user: useAvailablePetitionLocales_UserFragment) {
  const locales = useSupportedPetitionLocales();
  return useMemo(
    () =>
      locales
        .filter((locale) => {
          return (
            ["en", "es"].includes(locale.key) ||
            user[
              `hasRecipientLang${
                locale.key.toUpperCase() as Uppercase<Exclude<PetitionLocale, "en" | "es">>
              }`
            ]
          );
        })
        .sort((a, b) => a.localizedLabel.localeCompare(b.localizedLabel)),
    [],
  );
}

useAvailablePetitionLocales.fragments = {
  User: gql`
    fragment useAvailablePetitionLocales_User on User {
      hasRecipientLangCA: hasFeatureFlag(featureFlag: RECIPIENT_LANG_CA)
      hasRecipientLangIT: hasFeatureFlag(featureFlag: RECIPIENT_LANG_IT)
      hasRecipientLangPT: hasFeatureFlag(featureFlag: RECIPIENT_LANG_PT)
    }
  `,
};
