import { outdent } from "outdent";
import { hashString } from "../../util/token";

interface TypstElement<T extends Record<string, string>> {
  (props: T, ...content: string[]): string[];
  (...content: string[]): string[];
}

export function element<T extends Record<string, string> = Record<string, string>>(
  name: string,
): TypstElement<T> & { noHash: TypstElement<T> } {
  const block = (noHash?: boolean) =>
    function block(props: string | T, ...content: string[]) {
      const [_props, _content] =
        typeof props === "string" ? [[], [props, ...content]] : [Object.entries(props), content];
      return [
        `${noHash ? "" : "#"}${name}(${_props.length ? _props.map(([p, v]) => `${p}: ${v}, `).join("") : ""}[`,
        ..._content.map((c) => "  " + c),
        "])",
      ];
    };
  return Object.assign(block(), { noHash: block(true) });
}

export function t(content: string) {
  return `#${JSON.stringify(content)}`;
}

export function tt(props: Record<string, string>, ...content: string[]) {
  return `#text(${Object.entries(props)
    .map(([p, v]) => `${p}: ${v}, `)
    .join("")}[${content.join("")}])`;
}

export function image(url: string, props: Record<string, string>) {
  return outdent`
    #prequery.image(
      ${JSON.stringify(url)},
      ${JSON.stringify(`assets/${Math.abs(hashString(url))}`)},
      ${Object.entries(props)
        .map(([p, v]) => `${p}: ${v}, `)
        .join("\n  ")}
    )
  `.split("\n");
}

export const block = element("block");
export const heading = element("heading");
export const text = element("text");
export const box = element("box");
