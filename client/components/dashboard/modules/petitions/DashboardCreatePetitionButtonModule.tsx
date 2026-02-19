import { gql } from "@apollo/client";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { Button } from "@parallel/components/ui";
import { DashboardCreatePetitionButtonModule_DashboardCreatePetitionButtonModuleFragment } from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { RefAttributes } from "react";
import { isNullish } from "remeda";
import { DashboardSimpleModuleCard } from "../../shared/DashboardSimpleModuleCard";

export function DashboardCreatePetitionButtonModule({
  module,
  ...rest
}: {
  module: DashboardCreatePetitionButtonModule_DashboardCreatePetitionButtonModuleFragment;
  isEditing: boolean;
  isDragging: boolean;
  isReadOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
} & RefAttributes<HTMLDivElement>) {
  const template = module.petitionButtonSettings.template;
  const createPetition = useCreatePetition();
  const goToPetition = useGoToPetition();

  const handleCreatePetition = async () => {
    const petitionId = await createPetition({
      petitionId: template!.id,
    });
    if (petitionId) {
      goToPetition(petitionId, "preview", { query: { new: "", fromTemplate: "" } });
    }
  };
  return (
    <DashboardSimpleModuleCard module={module} {...rest} alignment="center">
      <Button
        colorPalette="primary"
        disabled={isNullish(template?.myEffectivePermission)}
        onClick={handleCreatePetition}
      >
        <OverflownText placement="bottom">{module.petitionButtonSettings.label}</OverflownText>
      </Button>
    </DashboardSimpleModuleCard>
  );
}

const _fragments = {
  DashboardCreatePetitionButtonModule: gql`
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
  `,
};
