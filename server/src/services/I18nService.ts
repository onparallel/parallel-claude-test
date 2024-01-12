import DataLoader from "dataloader";
import { injectable } from "inversify";
import pMap from "p-map";
import { IntlShape, createIntl, createIntlCache } from "react-intl";
import { zip } from "remeda";
import { ContactLocale, UserLocale, UserLocaleValues } from "../db/__types";
import { LocalizableUserText } from "../graphql";
import { loadMessages } from "../util/loadMessages";

export const I18N_SERVICE = Symbol.for("I18N_SERVICE");

type Locale = ContactLocale | UserLocale;

export interface II18nService {
  getIntl(locale: Locale): Promise<IntlShape>;
  getLocalizableUserText(
    ...args: Parameters<IntlShape["formatMessage"]>
  ): Promise<LocalizableUserText>;
}

@injectable()
export class I18nService implements II18nService {
  private intlLoader = new DataLoader<Locale, IntlShape>(async (keys) => {
    const messages = await pMap(keys, async (locale) => await loadMessages(locale));
    return zip(keys, messages).map(([locale, messages]) =>
      createIntl({ locale, messages, onWarn: () => {} }, createIntlCache()),
    );
  });

  async getIntl(locale: Locale): Promise<IntlShape> {
    return this.intlLoader.load(locale);
  }

  async getLocalizableUserText(...args: Parameters<IntlShape["formatMessage"]>) {
    const entries = await pMap(UserLocaleValues, async (locale) => {
      const intl = await this.getIntl(locale);
      return [locale, intl.formatMessage(...args)] as const;
    });
    return Object.fromEntries(entries) as LocalizableUserText;
  }
}
