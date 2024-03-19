import { Scalars, UserLocale } from "@parallel/graphql/__types";
import { asSupportedUserLocale } from "@parallel/utils/locales";
import { ReactNode } from "react";
import { IntlShape, useIntl } from "react-intl";
import { isDefined } from "remeda";

export type LocalizableUserText = Scalars["LocalizableUserText"]["input"];

interface LocalizableUserTextRenderProps {
  value: LocalizableUserText;
  locale?: UserLocale;
  default: ReactNode;
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
  ].find((l) => isDefined(l) && isDefined(value[l]));

  const val = isDefined(locale)
    ? Array.isArray(value[locale])
      ? value[locale]?.[0]
      : value[locale]
    : null;
  return <>{isDefined(locale) ? val?.trim() || _default : _default}</>;
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
  ].find((l) => isDefined(l) && isDefined(value[l]) && value[l]!.length > 0);
  return isDefined(locale) ? value[locale]?.trim() || _default : _default;
}

export function isValidLocalizableUserText(label: { [key: string]: string | null }) {
  return Object.values(label).some((value) => (value ?? "").trim().length > 0);
}
