import { createIntl, IntlConfig, IntlShape } from "@formatjs/intl";
import { injectable } from "inversify";
import pMap from "p-map";
import { ContactLocale, UserLocale, UserLocaleValues } from "../db/__types";
import { LocalizableUserText } from "../graphql";
import { loadMessages } from "../util/loadMessages";

export const I18N_SERVICE = Symbol.for("I18N_SERVICE");

export interface II18nService {
  getIntl(
    locale: ContactLocale | UserLocale,
    options?: Omit<IntlConfig, "locale" | "messages" | "onWarn">
  ): Promise<IntlShape>;
  getLocalizableUserText(
    ...args: Parameters<IntlShape["formatMessage"]>
  ): Promise<LocalizableUserText>;
}

@injectable()
export class I18nService implements II18nService {
  async getIntl(
    locale: ContactLocale | UserLocale,
    options?: Omit<IntlConfig, "locale" | "messages" | "onWarn">
  ): Promise<IntlShape> {
    const messages = await loadMessages(locale);
    return createIntl({ locale, messages, onWarn: () => {}, ...options });
  }

  async getLocalizableUserText(...args: Parameters<IntlShape["formatMessage"]>) {
    const entries = await pMap(
      UserLocaleValues,
      async (locale) => {
        const intl = await this.getIntl(locale);
        return [locale, intl.formatMessage(...args)] as const;
      },
      { concurrency: 1 }
    );
    return Object.fromEntries(entries) as LocalizableUserText;
  }
}
