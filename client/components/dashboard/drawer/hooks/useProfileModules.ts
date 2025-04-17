import { useMemo } from "react";
import { useIntl } from "react-intl";
import { ModuleCategory, ModuleType } from "../DashboardModuleDrawer";

export function useProfileModules() {
  const intl = useIntl();

  return useMemo<
    {
      name: string;
      category: ModuleCategory;
      type: ModuleType;
    }[]
  >(() => {
    return [
      {
        name: intl.formatMessage({
          id: "component.module-tabs.numeric-module",
          defaultMessage: "Numeric",
        }),
        category: "NUMBER",
        type: "DashboardProfilesNumberModule",
      },
      {
        name: intl.formatMessage({
          id: "component.module-tabs.ratio-module",
          defaultMessage: "Percentage / ratio",
        }),
        category: "RATIO",
        type: "DashboardProfilesRatioModule",
      },
      {
        name: intl.formatMessage({
          id: "component.module-tabs.pie-chart-module",
          defaultMessage: "Pie chart",
        }),
        category: "CHART",
        type: "DashboardProfilesPieChartModule",
      },
    ];
  }, [intl.locale]);
}
