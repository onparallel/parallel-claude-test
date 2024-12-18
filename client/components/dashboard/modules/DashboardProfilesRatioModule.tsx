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
  const values =
    module.profilesRatioSettings.type === "COUNT"
      ? (module.profilesRatioResult?.items.map((i) => i.count) ?? [])
      : (module.profilesRatioResult?.items.map((i) => i.aggr ?? 0) ?? []);
  return (
    <DashboardSimpleModuleCard
      module={module}
      headerAddon={
        module.profilesRatioResult?.isIncongruent ? <DashboardModuleAlertIncongruent /> : undefined
      }
    >
      {isNonNullish(module.profilesRatioResult) ? (
        <DashboardRatio
          value={values[0]}
          total={values[1]}
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
        items {
          count
          aggr
        }
        isIncongruent
      }
      profilesRatioSettings: settings {
        graphicType
        type
      }
    }
    ${DashboardSimpleModuleCard.fragments.DashboardModule}
  `,
};
