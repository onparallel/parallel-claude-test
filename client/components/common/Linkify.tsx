import LinkifyIt, { Match } from "linkify-it";
import { cloneElement, isValidElement, ReactNode } from "react";
import { NormalLink } from "./Link";

const linkify = new LinkifyIt();
// by default linkify makes http links
const _normalize = linkify.normalize as any;
linkify.normalize = function (match: Match) {
  if (!match.schema) {
    match.schema = "https";
    match.url = "https://" + match.url;
  }
  return _normalize(match);
} as any;

export function Linkify({ children }: { children: ReactNode }) {
  return <>{parse(children)}</>;
}

function parse(children: ReactNode, key = 0): ReactNode {
  if (typeof children === "string") {
    return parseText(children);
  } else if (isValidElement(children) && !["a", "button"].includes(children.type as any)) {
    return cloneElement(children, { key: key }, parse(children.props.children));
  } else if (Array.isArray(children)) {
    return children.map((child, i) => parse(child, i));
  }
  return children;
}

function parseText(text: string): ReactNode {
  if (!linkify.test(text)) {
    return text;
  }
  const matches = linkify.match(text);
  if (!matches) {
    return text;
  }

  const elements: ReactNode[] = [];
  let lastIndex = 0;
  for (const [i, match] of Array.from(matches.entries())) {
    // Push preceding text if there is any
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    elements.push(
      <NormalLink href={match.url} isExternal key={i}>
        {match.text}
      </NormalLink>
    );

    lastIndex = match.lastIndex;
  }

  // Push remaining text if there is any
  if (text.length > lastIndex) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length === 1 ? elements[0] : elements;
}
