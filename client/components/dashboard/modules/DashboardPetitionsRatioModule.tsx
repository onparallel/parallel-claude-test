import { gql } from "@apollo/client";
import { DashboardPetitionsRatioModule_DashboardPetitionsRatioModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardModuleAlertIncongruent } from "../shared/DashboardModuleAlertIncongruent";
import { DashboardRatio } from "../shared/DashboardRatio";
import { DashboardSimpleModuleCard } from "../shared/DashboardSimpleModuleCard";

export function DashboardPetitionsRatioModule({
  module,
}: {
  module: DashboardPetitionsRatioModule_DashboardPetitionsRatioModuleFragment;
}) {
  return (
    <DashboardSimpleModuleCard
      module={module}
      headerAddon={
        module.petitionsRatioResult?.isIncongruent ? <DashboardModuleAlertIncongruent /> : undefined
      }
    >
      {isNonNullish(module.petitionsRatioResult) ? (
        <DashboardRatio
          value={module.petitionsRatioResult.value[0]}
          total={module.petitionsRatioResult.value[1]}
          isPercentage={module.petitionsRatioSettings.graphicType === "PERCENTAGE"}
        />
      ) : null}
    </DashboardSimpleModuleCard>
  );
}

DashboardPetitionsRatioModule.fragments = {
  DashboardPetitionsRatioModule: gql`
    fragment DashboardPetitionsRatioModule_DashboardPetitionsRatioModule on DashboardPetitionsRatioModule {
      ...DashboardSimpleModuleCard_DashboardModule
      petitionsRatioResult: result {
        value
        isIncongruent
      }
      petitionsRatioSettings: settings {
        graphicType
      }
    }
    ${DashboardSimpleModuleCard.fragments.DashboardModule}
  `,
};
