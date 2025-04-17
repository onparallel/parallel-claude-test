import { gql } from "@apollo/client";
import { DashboardPetitionsRatioModule_DashboardPetitionsRatioModuleFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { isNonNullish } from "remeda";
import { DashboardModuleAlertIncongruent } from "../../shared/DashboardModuleAlertIncongruent";
import { DashboardRatio } from "../../shared/DashboardRatio";
import { DashboardSimpleModuleCard } from "../../shared/DashboardSimpleModuleCard";

export const DashboardPetitionsRatioModule = Object.assign(
  forwardRef<
    HTMLDivElement,
    {
      module: DashboardPetitionsRatioModule_DashboardPetitionsRatioModuleFragment;
      isEditing: boolean;
      isDragging: boolean;
      onEdit: () => void;
      onDelete: () => void;
    }
  >(function DashboardPetitionsRatioModule({ module, ...rest }, ref) {
    return (
      <DashboardSimpleModuleCard
        ref={ref}
        module={module}
        headerAddon={
          module.petitionsRatioResult?.isIncongruent ? (
            <DashboardModuleAlertIncongruent />
          ) : undefined
        }
        {...rest}
      >
        {isNonNullish(module.petitionsRatioResult) ? (
          <DashboardRatio
            value={module.petitionsRatioResult.items[0].count}
            total={module.petitionsRatioResult.items[1].count}
            isPercentage={module.petitionsRatioSettings.graphicType === "PERCENTAGE"}
            isEditing={rest.isEditing}
          />
        ) : null}
      </DashboardSimpleModuleCard>
    );
  }),
  {
    fragments: {
      DashboardPetitionsRatioModule: gql`
        fragment DashboardPetitionsRatioModule_DashboardPetitionsRatioModule on DashboardPetitionsRatioModule {
          ...DashboardSimpleModuleCard_DashboardModule
          petitionsRatioResult: result {
            items {
              count
            }
            isIncongruent
          }
          petitionsRatioSettings: settings {
            graphicType
          }
        }
        ${DashboardSimpleModuleCard.fragments.DashboardModule}
      `,
    },
  },
);
