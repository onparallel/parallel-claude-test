import { SimpleOption } from "@parallel/components/common/SimpleSelect";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useLogicalOperators() {
  const intl = useIntl();
  return useMemo<SimpleOption<"OR" | "AND">[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "generic.condition-logical-join-or",
          defaultMessage: "or",
        }),
        value: "OR",
      },
      {
        label: intl.formatMessage({
          id: "generic.condition-logical-join-and",
          defaultMessage: "and",
        }),
        value: "AND",
      },
    ];
  }, [intl.locale]);
}
