import { PaperPlaneIcon, ProfilesIcon } from "@parallel/chakra/icons";
import { DashboardModuleForm_DashboardModuleFragment } from "@parallel/graphql/__types";
import { ElementType, useMemo } from "react";
import { useIntl } from "react-intl";

export type DashboardModuleType = Exclude<
  DashboardModuleForm_DashboardModuleFragment["__typename"],
  undefined
>;

export type DashboardModuleCategory = "PETITIONS" | "PROFILES";

export function useDashboardModuleCategories() {
  const intl = useIntl();

  return useMemo<
    {
      name: string;
      category: DashboardModuleCategory;
      icon: ElementType;
    }[]
  >(
    () => [
      {
        category: "PETITIONS",
        name: intl.formatMessage({ id: "generic.root-petitions", defaultMessage: "Parallels" }),
        icon: PaperPlaneIcon,
      },
      {
        category: "PROFILES",
        name: intl.formatMessage({ id: "generic.profiles", defaultMessage: "Profiles" }),
        icon: ProfilesIcon,
      },
    ],
    [intl.locale],
  );
}

export function useDashboardModules() {
  const intl = useIntl();

  return useMemo<
    {
      name: string;
      category: DashboardModuleCategory;
      type: DashboardModuleType;
      imageUrl: string;
    }[]
  >(() => {
    return [
      {
        name: intl.formatMessage({
          id: "util.use-dashboard-modules.numeric-module",
          defaultMessage: "Numeric",
        }),
        category: "PETITIONS",
        type: "DashboardPetitionsNumberModule",
        imageUrl: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/NUMBER_MODULE.png`,
      },
      {
        name: intl.formatMessage({
          id: "util.use-dashboard-modules.ratio-module",
          defaultMessage: "Percentage / ratio",
        }),
        category: "PETITIONS",
        type: "DashboardPetitionsRatioModule",
        imageUrl: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/RATIO_MODULE.png`,
      },
      {
        name: intl.formatMessage({
          id: "util.use-dashboard-modules.pie-chart-module",
          defaultMessage: "Pie chart",
        }),
        category: "PETITIONS",
        type: "DashboardPetitionsPieChartModule",
        imageUrl: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/CHART_MODULE.png`,
      },
      {
        name: intl.formatMessage({
          id: "util.use-dashboard-modules.button-module",
          defaultMessage: "Action button",
        }),
        category: "PETITIONS",
        type: "DashboardCreatePetitionButtonModule",
        imageUrl: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/BUTTON_MODULE.png`,
      },
      {
        name: intl.formatMessage({
          id: "util.use-dashboard-modules.numeric-module",
          defaultMessage: "Numeric",
        }),
        category: "PROFILES",
        type: "DashboardProfilesNumberModule",
        imageUrl: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/NUMBER_MODULE.png`,
      },
      {
        name: intl.formatMessage({
          id: "util.use-dashboard-modules.ratio-module",
          defaultMessage: "Percentage / ratio",
        }),
        category: "PROFILES",
        type: "DashboardProfilesRatioModule",
        imageUrl: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/RATIO_MODULE.png`,
      },
      {
        name: intl.formatMessage({
          id: "util.use-dashboard-modules.pie-chart-module",
          defaultMessage: "Pie chart",
        }),
        category: "PROFILES",
        type: "DashboardProfilesPieChartModule",
        imageUrl: `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/CHART_MODULE.png`,
      },
    ];
  }, [intl.locale]);
}
