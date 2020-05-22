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

/**
 * Given a Next.js pathname, returns the list of parameters used in it.
 * @param pathname The pathname, e.g. "/[locale]/app/petitions/[petitionId]"
 * @returns The parameters used in the pathname, e.g. ['locale', 'petitionId']
 */
export function pathParams(pathname: string) {
  return (pathname.match(/\[(\.{3})?([^\]]*)]/g) ?? []).map((param) =>
    param.replace(/^\[(\.{3})?/, "").replace(/\]$/, "")
  );
}
