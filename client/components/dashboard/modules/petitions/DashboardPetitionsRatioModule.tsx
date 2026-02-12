import { gql } from "@apollo/client";
import { DashboardPetitionsRatioModule_DashboardPetitionsRatioModuleFragment } from "@parallel/graphql/__types";
import { removeTypenames } from "@parallel/utils/apollo/removeTypenames";
import { buildPetitionsQueryStateUrl } from "@parallel/utils/petitionsQueryState";
import { RefAttributes, useMemo } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardLinkToResults } from "../../shared/DashboardLinkToResults";
import { DashboardRatio } from "../../shared/DashboardRatio";
import { DashboardSimpleModuleCard } from "../../shared/DashboardSimpleModuleCard";

export function DashboardPetitionsRatioModule({
  module,
  ...rest
}: {
  module: DashboardPetitionsRatioModule_DashboardPetitionsRatioModuleFragment;
  isEditing: boolean;
  isDragging: boolean;
  isReadOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
} & RefAttributes<HTMLDivElement>) {
  const intl = useIntl();

  const resultsUrls = useMemo(() => {
    const { tags, ...filters } = removeTypenames(module.petitionsRatioSettings.filters[0]);
    return buildPetitionsQueryStateUrl(
      {
        view: "-ALL", // this forces ALL instead of the default view
        ...filters,
        tagsFilters: tags,
      },
      {
        fromDashboardModule:
          module.title ||
          intl.formatMessage({
            id: "component.dashboard-module-card.untitled-module",
            defaultMessage: "Untitled module",
          }),
      },
    );
  }, []);

  return (
    <DashboardSimpleModuleCard
      module={module}
      headerAddon={
        <DashboardLinkToResults
          href={resultsUrls}
          label={intl.formatMessage({
            id: "generic.view-petitions",
            defaultMessage: "View parallels",
          })}
        />
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
}

const _fragments = {
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
        filters {
          ...fullDashboardModulePetitionFilter
        }
      }
    }
  `,
};
