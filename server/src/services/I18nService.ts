import { createIntl, IntlConfig, IntlShape } from "@formatjs/intl";
import { injectable } from "inversify";
import { ContactLocale, UserLocale } from "../db/__types";
import { loadMessages } from "../util/loadMessages";

export const I18N_SERVICE = Symbol.for("I18N_SERVICE");

export interface II18nService {
  getIntl(
    locale: ContactLocale | UserLocale,
    options?: Omit<IntlConfig, "locale" | "messages" | "onWarn">
  ): Promise<IntlShape>;
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
}
