import { ReactNode } from "react";
import { IntlShape, useIntl } from "react-intl";

export function WithIntl({ children }: { children: (intl: IntlShape) => ReactNode }) {
  const intl = useIntl();
  return <>{children(intl)}</>;
}
