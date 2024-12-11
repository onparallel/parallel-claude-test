import { gql } from "@apollo/client";
import { DashboardProfilesNumberModule_DashboardProfilesNumberModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardNumberValue } from "../shared/DashboardNumberValue";
import { DashboardSimpleModuleCard } from "../shared/DashboardSimpleModuleCard";

export function DashboardProfilesNumberModule({
  module,
}: {
  module: DashboardProfilesNumberModule_DashboardProfilesNumberModuleFragment;
}) {
  return (
    <DashboardSimpleModuleCard module={module}>
      {isNonNullish(module.profilesNumberResult) ? (
        <DashboardNumberValue value={module.profilesNumberResult.value} />
      ) : null}
    </DashboardSimpleModuleCard>
  );
}

DashboardProfilesNumberModule.fragments = {
  DashboardProfilesNumberModule: gql`
    fragment DashboardProfilesNumberModule_DashboardProfilesNumberModule on DashboardProfilesNumberModule {
      ...DashboardSimpleModuleCard_DashboardModule
      profilesNumberResult: result {
        value
      }
    }
    ${DashboardSimpleModuleCard.fragments.DashboardModule}
  `,
};
