import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useHasPermission } from "./useHasPermission";

export function useReportsSections() {
  const intl = useIntl();

  const hasOverviewAccess = useHasPermission("REPORTS:OVERVIEW");
  const hasTemplateStatisticsAccess = useHasPermission("REPORTS:TEMPLATE_STATISTICS");
  const hasTemplateRepliesAccess = useHasPermission("REPORTS:TEMPLATE_REPLIES");

  return useMemo(() => {
    const withAccess = [];

    if (hasOverviewAccess) {
      withAccess.push({
        title: intl.formatMessage({
          id: "page.reports.overview",
          defaultMessage: "Overview",
        }),
        path: "/app/reports/overview",
      });
    }

    if (hasTemplateStatisticsAccess) {
      withAccess.push({
        title: intl.formatMessage({
          id: "page.reports.statistics",
          defaultMessage: "Template statistics",
        }),
        path: "/app/reports/statistics",
      });
    }

    if (hasTemplateRepliesAccess) {
      withAccess.push({
        title: intl.formatMessage({
          id: "page.reports.replies",
          defaultMessage: "Replies",
        }),
        path: "/app/reports/replies",
      });
    }
    return withAccess;
  }, [intl.locale]);
}
