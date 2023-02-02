import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useReportsSections() {
  const intl = useIntl();
  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({
          id: "page.reports.overview",
          defaultMessage: "Overview",
        }),
        path: "/app/reports/overview",
      },
      {
        title: intl.formatMessage({
          id: "page.reports.statistics",
          defaultMessage: "Template statistics",
        }),
        path: "/app/reports/statistics",
      },
      {
        title: intl.formatMessage({
          id: "page.reports.replies",
          defaultMessage: "Replies",
        }),
        path: "/app/reports/replies",
      },
    ];
  }, [intl.locale]);
}
