import { ReactNode } from "react";
import { IntlShape, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { UserLocale } from "../../db/__types";

const USER_LOCALES = ["en", "es"];

type LocalizableUserText = { [locale in UserLocale]?: string };

interface LocalizableUserTextRenderProps {
  value: LocalizableUserText;
  locale?: UserLocale;
  default: ReactNode;
}

function asSupportedUserLocale(locale: string): UserLocale {
  if (USER_LOCALES.some((l) => l === locale)) {
    return locale as UserLocale;
  } else {
    return "en";
  }
}

export function LocalizableUserTextRender({
  value,
  locale: _locale,
  default: _default,
}: LocalizableUserTextRenderProps) {
  const intl = useIntl();
  const locale = [
    _locale,
    asSupportedUserLocale(intl.locale),
    "en" as UserLocale,
    Object.keys(value)[0] as UserLocale,
  ].find((l) => isNonNullish(l) && isNonNullish(value[l]));

  const val = isNonNullish(locale)
    ? Array.isArray(value[locale])
      ? value[locale]?.[0]
      : value[locale]
    : null;
  return <>{isNonNullish(locale) ? val?.trim() || _default : _default}</>;
}

interface LocalizableUserTextRenderOptions {
  intl?: IntlShape;
  value: LocalizableUserText;
  locale?: UserLocale;
  default: string;
}

export function localizableUserTextRender({
  intl,
  value,
  locale: _locale,
  default: _default,
}: LocalizableUserTextRenderOptions) {
  const locale = [
    _locale,
    intl ? asSupportedUserLocale(intl.locale) : null,
    "en" as UserLocale,
    ...(Object.keys(value) as UserLocale[]),
  ].find((l) => isNonNullish(l) && isNonNullish(value[l]) && value[l]!.length > 0);
  return isNonNullish(locale) ? value[locale]?.trim() || _default : _default;
}

export function isValidLocalizableUserText(label: { [key: string]: string | null }) {
  return Object.values(label).some((value) => (value ?? "").trim().length > 0);
}
