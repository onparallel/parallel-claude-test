import { gql } from "@apollo/client";
import { Button } from "@chakra-ui/react";
import { DashboardCreateParallelButtonModule_DashboardCreateParallelButtonModuleFragment } from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { isNullish } from "remeda";
import { DashboardSimpleModuleCard } from "../shared/DashboardSimpleModuleCard";

export function DashboardCreateParallelButtonModule({
  module,
}: {
  module: DashboardCreateParallelButtonModule_DashboardCreateParallelButtonModuleFragment;
}) {
  const template = module.parallelButtonSettings.template;
  const createPetition = useCreatePetition();
  const goToPetition = useGoToPetition();

  const handleCreatePetition = async () => {
    const petitionId = await createPetition({
      petitionId: template!.id,
    });
    goToPetition(petitionId, "preview", { query: { new: "", fromTemplate: "" } });
  };
  return (
    <DashboardSimpleModuleCard module={module} alignment="center">
      <Button
        colorScheme="primary"
        isDisabled={isNullish(template?.myEffectivePermission)}
        onClick={handleCreatePetition}
      >
        {module.parallelButtonSettings.label}
      </Button>
    </DashboardSimpleModuleCard>
  );
}

DashboardCreateParallelButtonModule.fragments = {
  get DashboardCreateParallelButtonModule() {
    return gql`
      fragment DashboardCreateParallelButtonModule_DashboardCreateParallelButtonModule on DashboardCreateParallelButtonModule {
        ...DashboardSimpleModuleCard_DashboardModule
        parallelButtonSettings: settings {
          label
          template {
            id
            myEffectivePermission {
              permissionType
            }
          }
        }
      }
      ${DashboardSimpleModuleCard.fragments.DashboardModule}
    `;
  },
};
