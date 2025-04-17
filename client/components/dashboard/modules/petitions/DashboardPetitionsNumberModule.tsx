import { gql } from "@apollo/client";
import { DashboardPetitionsNumberModule_DashboardPetitionsNumberModuleFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { isNonNullish } from "remeda";
import { DashboardNumberValue } from "../../shared/DashboardNumberValue";
import { DashboardSimpleModuleCard } from "../../shared/DashboardSimpleModuleCard";

export const DashboardPetitionsNumberModule = Object.assign(
  forwardRef<
    HTMLDivElement,
    {
      module: DashboardPetitionsNumberModule_DashboardPetitionsNumberModuleFragment;
      isEditing: boolean;
      isDragging: boolean;
      onEdit: () => void;
      onDelete: () => void;
    }
  >(function DashboardPetitionsNumberModule({ module, ...rest }, ref) {
    return (
      <DashboardSimpleModuleCard ref={ref} module={module} {...rest}>
        {isNonNullish(module.petitionsNumberResult) ? (
          <DashboardNumberValue
            value={module.petitionsNumberResult.count}
            isEditing={rest.isEditing}
          />
        ) : null}
      </DashboardSimpleModuleCard>
    );
  }),
  {
    fragments: {
      DashboardPetitionsNumberModule: gql`
        fragment DashboardPetitionsNumberModule_DashboardPetitionsNumberModule on DashboardPetitionsNumberModule {
          ...DashboardSimpleModuleCard_DashboardModule
          petitionsNumberResult: result {
            count
          }
        }
        ${DashboardSimpleModuleCard.fragments.DashboardModule}
      `,
    },
  },
);
