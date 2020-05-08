import { ReactNode, useState, useEffect } from "react";

/**
 * Don't render the children component on SSR.
 */
export function NoSSR({
  fallback,
  children,
}: {
  /**
   * Fallback React node to render on SSR
   */
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const [canRender, setCanRender] = useState(false);
  useEffect(() => setCanRender(true), []);
  return <>{canRender ? children : fallback ?? null}</>;
}
