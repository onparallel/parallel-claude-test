import { gql } from "@apollo/client";
import { DashboardPetitionsNumberModule_DashboardPetitionsNumberModuleFragment } from "@parallel/graphql/__types";
import { removeTypenames } from "@parallel/utils/apollo/removeTypenames";
import { buildPetitionsQueryStateUrl } from "@parallel/utils/petitionsQueryState";
import { forwardRef, useMemo } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { fullDashboardModulePetitionFilter } from "../../drawer/utils/moduleUtils";
import { DashboardLinkToResults } from "../../shared/DashboardLinkToResults";
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
    const intl = useIntl();
    const resultsUrls = useMemo(() => {
      const { tags, ...filters } = removeTypenames(module.settings.filters);
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
        ref={ref}
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
          settings {
            filters {
              ...fullDashboardModulePetitionFilter
            }
          }
        }
        ${DashboardSimpleModuleCard.fragments.DashboardModule}
        ${fullDashboardModulePetitionFilter}
      `,
    },
  },
);
