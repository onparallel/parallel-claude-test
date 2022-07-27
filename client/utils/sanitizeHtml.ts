import createDOMPurify, { Config } from "dompurify";

export const sanitizeHtml = (function init() {
  // cache instance of DOMPurify
  const DOMPurify = createDOMPurify(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    typeof window === "undefined" ? (new (require("jsdom").JSDOM)("").window as any) : window
  );
  return function (source: string, config: Config = {}) {
    return DOMPurify.sanitize(source, config) as string;
  };
})();
