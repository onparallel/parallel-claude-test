export async function loadMessages(
  // TODO locales
  // locale: ContactLocale | UserLocale,
  locale: string
) {
  if (process.env.NODE_ENV !== "production") {
    const { default: messages } = await import(`../../lang/${locale}.json`);
    return Object.fromEntries(messages.map((t: any) => [t.term, t.definition]));
  } else {
    return await import(`../../lang/compiled/${locale}.json`);
  }
}
