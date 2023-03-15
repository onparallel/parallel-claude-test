import { ContactLocale, UserLocale } from "../db/__types";

export async function loadMessages(locale: ContactLocale | UserLocale) {
  if (process.env.NODE_ENV !== "production") {
    const { default: messages } = await import(`../../lang/${locale}.json`);
    return Object.fromEntries(messages.map((t: any) => [t.term, t.definition]));
  } else {
    return await import(`../../lang/compiled/${locale}.json`);
  }
}
