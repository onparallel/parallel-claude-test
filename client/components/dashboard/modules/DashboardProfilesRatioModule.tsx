import { gql } from "@apollo/client";
import { DashboardProfilesRatioModule_DashboardProfilesRatioModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardModuleAlertIncongruent } from "../shared/DashboardModuleAlertIncongruent";
import { DashboardRatio } from "../shared/DashboardRatio";
import { DashboardSimpleModuleCard } from "../shared/DashboardSimpleModuleCard";

export function DashboardProfilesRatioModule({
  module,
}: {
  module: DashboardProfilesRatioModule_DashboardProfilesRatioModuleFragment;
}) {
  return (
    <DashboardSimpleModuleCard
      module={module}
      headerAddon={
        module.profilesRatioResult?.isIncongruent ? <DashboardModuleAlertIncongruent /> : undefined
      }
    >
      {isNonNullish(module.profilesRatioResult) ? (
        <DashboardRatio
          value={module.profilesRatioResult.value[0]}
          total={module.profilesRatioResult.value[1]}
          isPercentage={module.profilesRatioSettings.graphicType === "PERCENTAGE"}
        />
      ) : null}
    </DashboardSimpleModuleCard>
  );
}

DashboardProfilesRatioModule.fragments = {
  DashboardProfilesRatioModule: gql`
    fragment DashboardProfilesRatioModule_DashboardProfilesRatioModule on DashboardProfilesRatioModule {
      ...DashboardSimpleModuleCard_DashboardModule
      profilesRatioResult: result {
        value
        isIncongruent
      }
      profilesRatioSettings: settings {
        graphicType
      }
    }
    ${DashboardSimpleModuleCard.fragments.DashboardModule}
  `,
};
