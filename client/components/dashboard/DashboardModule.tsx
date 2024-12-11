import { gql } from "@apollo/client";
import { DashboardModule_DashboardModuleFragment } from "@parallel/graphql/__types";
import { memo } from "react";
import { DashboardCreateParallelButtonModule } from "./modules/DashboardCreateParallelButtonModule";
import { DashboardParallelsNumberModule } from "./modules/DashboardParallelsNumberModule";
import { DashboardParallelsPieChartModule } from "./modules/DashboardParallelsPieChartModule";
import { DashboardParallelsRatioModule } from "./modules/DashboardParallelsRatioModule";
import { DashboardProfilesNumberModule } from "./modules/DashboardProfilesNumberModule";
import { DashboardProfilesPieChartModule } from "./modules/DashboardProfilesPieChartModule";
import { DashboardProfilesRatioModule } from "./modules/DashboardProfilesRatioModule";

export const DashboardModule = Object.assign(
  memo(function DashboardModule({ module }: { module: DashboardModule_DashboardModuleFragment }) {
    return (
      <>
        {module.__typename === "DashboardParallelsNumberModule" && (
          <DashboardParallelsNumberModule module={module} />
        )}
        {module.__typename === "DashboardProfilesNumberModule" && (
          <DashboardProfilesNumberModule module={module} />
        )}
        {module.__typename === "DashboardParallelsRatioModule" && (
          <DashboardParallelsRatioModule module={module} />
        )}
        {module.__typename === "DashboardProfilesRatioModule" && (
          <DashboardProfilesRatioModule module={module} />
        )}
        {module.__typename === "DashboardParallelsPieChartModule" && (
          <DashboardParallelsPieChartModule module={module} />
        )}
        {module.__typename === "DashboardProfilesPieChartModule" && (
          <DashboardProfilesPieChartModule module={module} />
        )}
        {module.__typename === "DashboardCreateParallelButtonModule" && (
          <DashboardCreateParallelButtonModule module={module} />
        )}
      </>
    );
  }),
  {
    fragments: {
      get DashboardModule() {
        return gql`
          fragment DashboardModule_DashboardModule on DashboardModule {
            id
            ... on DashboardParallelsNumberModule {
              ...DashboardParallelsNumberModule_DashboardParallelsNumberModule
            }
            ... on DashboardProfilesNumberModule {
              ...DashboardProfilesNumberModule_DashboardProfilesNumberModule
            }
            ... on DashboardParallelsRatioModule {
              ...DashboardParallelsRatioModule_DashboardParallelsRatioModule
            }
            ... on DashboardProfilesRatioModule {
              ...DashboardProfilesRatioModule_DashboardProfilesRatioModule
            }
            ... on DashboardParallelsPieChartModule {
              ...DashboardParallelsPieChartModule_DashboardParallelsPieChartModule
            }
            ... on DashboardProfilesPieChartModule {
              ...DashboardProfilesPieChartModule_DashboardProfilesPieChartModule
            }
            ... on DashboardCreateParallelButtonModule {
              ...DashboardCreateParallelButtonModule_DashboardCreateParallelButtonModule
            }
          }
          ${DashboardParallelsNumberModule.fragments.DashboardParallelsNumberModule}
          ${DashboardProfilesNumberModule.fragments.DashboardProfilesNumberModule}
          ${DashboardParallelsRatioModule.fragments.DashboardParallelsRatioModule}
          ${DashboardProfilesRatioModule.fragments.DashboardProfilesRatioModule}
          ${DashboardParallelsPieChartModule.fragments.DashboardParallelsPieChartModule}
          ${DashboardProfilesPieChartModule.fragments.DashboardProfilesPieChartModule}
          ${DashboardCreateParallelButtonModule.fragments.DashboardCreateParallelButtonModule}
        `;
      },
    },
  },
);
