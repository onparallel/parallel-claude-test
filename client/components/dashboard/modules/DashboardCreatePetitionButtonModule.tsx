import { gql } from "@apollo/client";
import { Button } from "@chakra-ui/react";
import { DashboardCreatePetitionButtonModule_DashboardCreatePetitionButtonModuleFragment } from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { isNullish } from "remeda";
import { DashboardSimpleModuleCard } from "../shared/DashboardSimpleModuleCard";

export function DashboardCreatePetitionButtonModule({
  module,
}: {
  module: DashboardCreatePetitionButtonModule_DashboardCreatePetitionButtonModuleFragment;
}) {
  const template = module.petitionButtonSettings.template;
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
        {module.petitionButtonSettings.label}
      </Button>
    </DashboardSimpleModuleCard>
  );
}

DashboardCreatePetitionButtonModule.fragments = {
  get DashboardCreatePetitionButtonModule() {
    return gql`
      fragment DashboardCreatePetitionButtonModule_DashboardCreatePetitionButtonModule on DashboardCreatePetitionButtonModule {
        ...DashboardSimpleModuleCard_DashboardModule
        petitionButtonSettings: settings {
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
