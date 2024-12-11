import { gql } from "@apollo/client";
import { DashboardParallelsNumberModule_DashboardParallelsNumberModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardNumberValue } from "../shared/DashboardNumberValue";
import { DashboardSimpleModuleCard } from "../shared/DashboardSimpleModuleCard";

export function DashboardParallelsNumberModule({
  module,
}: {
  module: DashboardParallelsNumberModule_DashboardParallelsNumberModuleFragment;
}) {
  return (
    <DashboardSimpleModuleCard module={module}>
      {isNonNullish(module.parallelsNumberResult) ? (
        <DashboardNumberValue value={module.parallelsNumberResult.value} />
      ) : null}
    </DashboardSimpleModuleCard>
  );
}

DashboardParallelsNumberModule.fragments = {
  DashboardParallelsNumberModule: gql`
    fragment DashboardParallelsNumberModule_DashboardParallelsNumberModule on DashboardParallelsNumberModule {
      ...DashboardSimpleModuleCard_DashboardModule
      parallelsNumberResult: result {
        value
      }
    }
    ${DashboardSimpleModuleCard.fragments.DashboardModule}
  `,
};
