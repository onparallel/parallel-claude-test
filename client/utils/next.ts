import { ParsedUrlQuery } from "querystring";

export function resolveUrl(pathname: string, query: ParsedUrlQuery) {
  return pathname.replace(/\[(\.{3})?([^\]]*)]/g, (_, spread, name) => {
    const parameter = query[name];
    if (spread && Array.isArray(parameter)) {
      return parameter.join("/");
    }
    return parameter as string;
  });
}
