import { cloneElement, Fragment, isValidElement, ReactNode } from "react";

export function BreakLines({ children }: { children: ReactNode }) {
  return <>{parse(children)}</>;
}

function parse(children: ReactNode, key = 0): ReactNode {
  if (typeof children === "string") {
    if (children.includes("\n")) {
      return children
        .split(/\n/)
        .flatMap((line, index) => [line, <br key={index} />])
        .slice(0, -1);
    } else {
      return children;
    }
  } else if (isValidElement(children)) {
    return cloneElement(children, { key: key }, parse(children.props.children));
  } else if (Array.isArray(children)) {
    return children.map((child, i) => parse(child, i));
  }
  return children;
}
