import { gql } from "@apollo/client";
import { DashboardProfilesNumberModule_DashboardProfilesNumberModuleFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { isNonNullish } from "remeda";
import { DashboardNumberValue } from "../../shared/DashboardNumberValue";
import { DashboardSimpleModuleCard } from "../../shared/DashboardSimpleModuleCard";

export const DashboardProfilesNumberModule = Object.assign(
  forwardRef<
    HTMLDivElement,
    {
      module: DashboardProfilesNumberModule_DashboardProfilesNumberModuleFragment;
      isEditing: boolean;
      isDragging: boolean;
      onEdit: () => void;
      onDelete: () => void;
    }
  >(function DashboardProfilesNumberModule({ module, ...rest }, ref) {
    return (
      <DashboardSimpleModuleCard ref={ref} module={module} {...rest}>
        {isNonNullish(module.profilesNumberResult) ? (
          <DashboardNumberValue
            value={
              module.profilesNumberSettings.type === "COUNT"
                ? module.profilesNumberResult.count
                : (module.profilesNumberResult.aggr ?? 0)
            }
            isEditing={rest.isEditing}
          />
        ) : null}
      </DashboardSimpleModuleCard>
    );
  }),
  {
    fragments: {
      DashboardProfilesNumberModule: gql`
        fragment DashboardProfilesNumberModule_DashboardProfilesNumberModule on DashboardProfilesNumberModule {
          ...DashboardSimpleModuleCard_DashboardModule
          profilesNumberResult: result {
            count
            aggr
          }
          profilesNumberSettings: settings {
            type
          }
        }
        ${DashboardSimpleModuleCard.fragments.DashboardModule}
      `,
    },
  },
);
