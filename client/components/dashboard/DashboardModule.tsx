import { gql } from "@apollo/client";
import { DashboardModule_DashboardModuleFragment } from "@parallel/graphql/__types";
import { memo } from "react";
import { DashboardCreatePetitionButtonModule } from "./modules/DashboardCreatePetitionButtonModule";
import { DashboardPetitionsNumberModule } from "./modules/DashboardPetitionsNumberModule";
import { DashboardPetitionsPieChartModule } from "./modules/DashboardPetitionsPieChartModule";
import { DashboardPetitionsRatioModule } from "./modules/DashboardPetitionsRatioModule";
import { DashboardProfilesNumberModule } from "./modules/DashboardProfilesNumberModule";
import { DashboardProfilesPieChartModule } from "./modules/DashboardProfilesPieChartModule";
import { DashboardProfilesRatioModule } from "./modules/DashboardProfilesRatioModule";

export const DashboardModule = Object.assign(
  memo(function DashboardModule({ module }: { module: DashboardModule_DashboardModuleFragment }) {
    return (
      <>
        {module.__typename === "DashboardPetitionsNumberModule" && (
          <DashboardPetitionsNumberModule module={module} />
        )}
        {module.__typename === "DashboardProfilesNumberModule" && (
          <DashboardProfilesNumberModule module={module} />
        )}
        {module.__typename === "DashboardPetitionsRatioModule" && (
          <DashboardPetitionsRatioModule module={module} />
        )}
        {module.__typename === "DashboardProfilesRatioModule" && (
          <DashboardProfilesRatioModule module={module} />
        )}
        {module.__typename === "DashboardPetitionsPieChartModule" && (
          <DashboardPetitionsPieChartModule module={module} />
        )}
        {module.__typename === "DashboardProfilesPieChartModule" && (
          <DashboardProfilesPieChartModule module={module} />
        )}
        {module.__typename === "DashboardCreatePetitionButtonModule" && (
          <DashboardCreatePetitionButtonModule module={module} />
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
            ... on DashboardPetitionsNumberModule {
              ...DashboardPetitionsNumberModule_DashboardPetitionsNumberModule
            }
            ... on DashboardProfilesNumberModule {
              ...DashboardProfilesNumberModule_DashboardProfilesNumberModule
            }
            ... on DashboardPetitionsRatioModule {
              ...DashboardPetitionsRatioModule_DashboardPetitionsRatioModule
            }
            ... on DashboardProfilesRatioModule {
              ...DashboardProfilesRatioModule_DashboardProfilesRatioModule
            }
            ... on DashboardPetitionsPieChartModule {
              ...DashboardPetitionsPieChartModule_DashboardPetitionsPieChartModule
            }
            ... on DashboardProfilesPieChartModule {
              ...DashboardProfilesPieChartModule_DashboardProfilesPieChartModule
            }
            ... on DashboardCreatePetitionButtonModule {
              ...DashboardCreatePetitionButtonModule_DashboardCreatePetitionButtonModule
            }
          }
          ${DashboardPetitionsNumberModule.fragments.DashboardPetitionsNumberModule}
          ${DashboardProfilesNumberModule.fragments.DashboardProfilesNumberModule}
          ${DashboardPetitionsRatioModule.fragments.DashboardPetitionsRatioModule}
          ${DashboardProfilesRatioModule.fragments.DashboardProfilesRatioModule}
          ${DashboardPetitionsPieChartModule.fragments.DashboardPetitionsPieChartModule}
          ${DashboardProfilesPieChartModule.fragments.DashboardProfilesPieChartModule}
          ${DashboardCreatePetitionButtonModule.fragments.DashboardCreatePetitionButtonModule}
        `;
      },
    },
  },
);
