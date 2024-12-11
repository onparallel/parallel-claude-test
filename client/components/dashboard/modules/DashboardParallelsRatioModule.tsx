import { gql } from "@apollo/client";
import { DashboardParallelsRatioModule_DashboardParallelsRatioModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardModuleAlertIncongruent } from "../shared/DashboardModuleAlertIncongruent";
import { DashboardRatio } from "../shared/DashboardRatio";
import { DashboardSimpleModuleCard } from "../shared/DashboardSimpleModuleCard";

export function DashboardParallelsRatioModule({
  module,
}: {
  module: DashboardParallelsRatioModule_DashboardParallelsRatioModuleFragment;
}) {
  return (
    <DashboardSimpleModuleCard
      module={module}
      headerAddon={
        module.parallelsRatioResult?.isIncongruent ? <DashboardModuleAlertIncongruent /> : undefined
      }
    >
      {isNonNullish(module.parallelsRatioResult) ? (
        <DashboardRatio
          value={module.parallelsRatioResult.value[0]}
          total={module.parallelsRatioResult.value[1]}
          isPercentage={module.parallelsRatioSettings.graphicType === "PERCENTAGE"}
        />
      ) : null}
    </DashboardSimpleModuleCard>
  );
}

DashboardParallelsRatioModule.fragments = {
  DashboardParallelsRatioModule: gql`
    fragment DashboardParallelsRatioModule_DashboardParallelsRatioModule on DashboardParallelsRatioModule {
      ...DashboardSimpleModuleCard_DashboardModule
      parallelsRatioResult: result {
        value
        isIncongruent
      }
      parallelsRatioSettings: settings {
        graphicType
      }
    }
    ${DashboardSimpleModuleCard.fragments.DashboardModule}
  `,
};
