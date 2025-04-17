import { gql } from "@apollo/client";
import { BoxProps } from "@chakra-ui/react";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { DashboardModule_DashboardModuleFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { DashboardCreatePetitionButtonModule } from "./modules/petitions/DashboardCreatePetitionButtonModule";
import { DashboardPetitionsNumberModule } from "./modules/petitions/DashboardPetitionsNumberModule";
import { DashboardPetitionsPieChartModule } from "./modules/petitions/DashboardPetitionsPieChartModule";
import { DashboardPetitionsRatioModule } from "./modules/petitions/DashboardPetitionsRatioModule";
import { DashboardProfilesNumberModule } from "./modules/profiles/DashboardProfilesNumberModule";
import { DashboardProfilesPieChartModule } from "./modules/profiles/DashboardProfilesPieChartModule";
import { DashboardProfilesRatioModule } from "./modules/profiles/DashboardProfilesRatioModule";

export interface DashboardModuleProps extends BoxProps {
  module: DashboardModule_DashboardModuleFragment;
  isEditing: boolean;
  isDragging: boolean;
  onEdit: () => void;
  onDelete: () => void;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
}

export const DashboardModule = Object.assign(
  forwardRef<HTMLDivElement, DashboardModuleProps>(({ module, ...rest }, ref) => {
    return (
      <>
        {module.__typename === "DashboardPetitionsNumberModule" && (
          <DashboardPetitionsNumberModule ref={ref} module={module} {...rest} />
        )}
        {module.__typename === "DashboardProfilesNumberModule" && (
          <DashboardProfilesNumberModule ref={ref} module={module} {...rest} />
        )}
        {module.__typename === "DashboardPetitionsRatioModule" && (
          <DashboardPetitionsRatioModule ref={ref} module={module} {...rest} />
        )}
        {module.__typename === "DashboardProfilesRatioModule" && (
          <DashboardProfilesRatioModule ref={ref} module={module} {...rest} />
        )}
        {module.__typename === "DashboardPetitionsPieChartModule" && (
          <DashboardPetitionsPieChartModule ref={ref} module={module} {...rest} />
        )}
        {module.__typename === "DashboardProfilesPieChartModule" && (
          <DashboardProfilesPieChartModule ref={ref} module={module} {...rest} />
        )}
        {module.__typename === "DashboardCreatePetitionButtonModule" && (
          <DashboardCreatePetitionButtonModule ref={ref} module={module} {...rest} />
        )}
      </>
    );
  }),
  {
    fragments: {
      DashboardModule: gql`
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
      `,
    },
  },
);
