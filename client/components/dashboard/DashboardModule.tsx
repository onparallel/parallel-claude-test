import { gql } from "@apollo/client";

import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { DashboardModule_DashboardModuleFragment } from "@parallel/graphql/__types";
import { RefAttributes } from "react";
import { BoxProps } from "@parallel/components/ui";
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
  isReadOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
}

export function DashboardModule({
  module,
  ...rest
}: DashboardModuleProps & RefAttributes<HTMLDivElement>) {
  return (
    <>
      {module.__typename === "DashboardPetitionsNumberModule" && (
        <DashboardPetitionsNumberModule module={module} {...rest} />
      )}
      {module.__typename === "DashboardProfilesNumberModule" && (
        <DashboardProfilesNumberModule module={module} {...rest} />
      )}
      {module.__typename === "DashboardPetitionsRatioModule" && (
        <DashboardPetitionsRatioModule module={module} {...rest} />
      )}
      {module.__typename === "DashboardProfilesRatioModule" && (
        <DashboardProfilesRatioModule module={module} {...rest} />
      )}
      {module.__typename === "DashboardPetitionsPieChartModule" && (
        <DashboardPetitionsPieChartModule module={module} {...rest} />
      )}
      {module.__typename === "DashboardProfilesPieChartModule" && (
        <DashboardProfilesPieChartModule module={module} {...rest} />
      )}
      {module.__typename === "DashboardCreatePetitionButtonModule" && (
        <DashboardCreatePetitionButtonModule module={module} {...rest} />
      )}
    </>
  );
}

const _fragments = {
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
  `,
};
