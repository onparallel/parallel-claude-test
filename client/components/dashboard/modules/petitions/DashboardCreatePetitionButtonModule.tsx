import { gql } from "@apollo/client";
import { Button } from "@chakra-ui/react";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { DashboardCreatePetitionButtonModule_DashboardCreatePetitionButtonModuleFragment } from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { forwardRef } from "react";
import { isNullish } from "remeda";
import { DashboardSimpleModuleCard } from "../../shared/DashboardSimpleModuleCard";

export const DashboardCreatePetitionButtonModule = Object.assign(
  forwardRef<
    HTMLDivElement,
    {
      module: DashboardCreatePetitionButtonModule_DashboardCreatePetitionButtonModuleFragment;
      isEditing: boolean;
      isDragging: boolean;
      isReadOnly: boolean;
      onEdit: () => void;
      onDelete: () => void;
    }
  >(function DashboardCreatePetitionButtonModule({ module, ...rest }, ref) {
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
      <DashboardSimpleModuleCard ref={ref} module={module} {...rest} alignment="center">
        <Button
          colorScheme="primary"
          isDisabled={isNullish(template?.myEffectivePermission)}
          onClick={handleCreatePetition}
        >
          <OverflownText placement="bottom">{module.petitionButtonSettings.label}</OverflownText>
        </Button>
      </DashboardSimpleModuleCard>
    );
  }),
  {
    fragments: {
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
    },
  },
);
