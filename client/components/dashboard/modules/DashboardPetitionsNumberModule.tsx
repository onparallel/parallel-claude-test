import { gql } from "@apollo/client";
import { DashboardPetitionsNumberModule_DashboardPetitionsNumberModuleFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { DashboardNumberValue } from "../shared/DashboardNumberValue";
import { DashboardSimpleModuleCard } from "../shared/DashboardSimpleModuleCard";

export function DashboardPetitionsNumberModule({
  module,
}: {
  module: DashboardPetitionsNumberModule_DashboardPetitionsNumberModuleFragment;
}) {
  return (
    <DashboardSimpleModuleCard module={module}>
      {isNonNullish(module.petitionsNumberResult) ? (
        <DashboardNumberValue value={module.petitionsNumberResult.count} />
      ) : null}
    </DashboardSimpleModuleCard>
  );
}

DashboardPetitionsNumberModule.fragments = {
  DashboardPetitionsNumberModule: gql`
    fragment DashboardPetitionsNumberModule_DashboardPetitionsNumberModule on DashboardPetitionsNumberModule {
      ...DashboardSimpleModuleCard_DashboardModule
      petitionsNumberResult: result {
        count
      }
    }
    ${DashboardSimpleModuleCard.fragments.DashboardModule}
  `,
};
