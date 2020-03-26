/**
 * Returns the most suitable language from a list of available ones given a
 * value of the Accept-Language header or navigator.languages.
 * More information on:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
 * @param accepts Value of the Accept-Language header or navigator.languages
 * @param available List of available languages
 * @param defaults Default language when nothing matches
 */
export function negotiate(
  accepts: string | readonly string[],
  available: string[],
  defaults: string
) {
  try {
    let preferred: string[];
    if (typeof accepts === "string") {
      const locales = accepts.split(/\s*,\s*/).map((lang) => {
        const match = lang.match(/^(\*|[a-z-]+)(?:;q=(.*))?$/i);
        if (!match) {
          throw new Error();
        }
        const [_, locale, quality] = match;
        return { locale, quality: quality ? parseFloat(quality) : 1 };
      });
      // do a very basic negotiation based just on language and ignoring region
      locales.sort((a, b) => b.quality - a.quality);
      preferred = locales.map(({ locale }) => locale);
    } else {
      preferred = accepts as any;
    }
    for (const locale of preferred) {
      if (locale === "*") {
        return defaults;
      } else {
        for (const lang of available) {
          // ignore regions for now
          const [l1] = lang.split("-");
          const [l2] = locale.split("-");
          if (l1.toLowerCase() === l2.toLowerCase()) {
            return lang;
          }
        }
      }
    }
    return available[0];
  } catch {
    return defaults;
  }
}
