import { gql } from "@apollo/client";
import { DashboardProfilesRatioModule_DashboardProfilesRatioModuleFragment } from "@parallel/graphql/__types";
import { buildProfilesQueryStateUrl } from "@parallel/utils/profilesQueryState";
import { forwardRef, useMemo } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  cleanDashboardModuleProfileFilter,
  fullDashboardModuleProfileFilter,
} from "../../drawer/utils/moduleUtils";
import { DashboardLinkToResults } from "../../shared/DashboardLinkToResults";
import { DashboardModuleAlertIncongruent } from "../../shared/DashboardModuleAlertIncongruent";
import { DashboardRatio } from "../../shared/DashboardRatio";
import { DashboardSimpleModuleCard } from "../../shared/DashboardSimpleModuleCard";

export const DashboardProfilesRatioModule = Object.assign(
  forwardRef<
    HTMLDivElement,
    {
      module: DashboardProfilesRatioModule_DashboardProfilesRatioModuleFragment;
      isEditing: boolean;
      isDragging: boolean;
      onEdit: () => void;
      onDelete: () => void;
    }
  >(function DashboardProfilesRatioModule({ module, ...rest }, ref) {
    const intl = useIntl();
    const values =
      module.profilesRatioSettings.type === "COUNT"
        ? (module.profilesRatioResult?.items.map((i) => i.count) ?? [])
        : (module.profilesRatioResult?.items.map((i) => i.aggr ?? 0) ?? []);

    const resultsUrls = useMemo(() => {
      return buildProfilesQueryStateUrl({
        view: "-ALL", // this forces ALL instead of the default view
        type: module.profilesRatioSettings.profileTypeId!,
        ...cleanDashboardModuleProfileFilter(module.profilesRatioSettings.filters[0]),
      });
    }, []);

    return (
      <DashboardSimpleModuleCard
        ref={ref}
        module={module}
        headerAddon={
          <>
            {module.profilesRatioResult?.isIncongruent ? (
              <DashboardModuleAlertIncongruent />
            ) : undefined}
            <DashboardLinkToResults
              href={resultsUrls}
              label={intl.formatMessage({
                id: "generic.view-profiles",
                defaultMessage: "View profiles",
              })}
            />
          </>
        }
        {...rest}
      >
        {isNonNullish(module.profilesRatioResult) ? (
          <DashboardRatio
            value={values[0]}
            total={values[1]}
            isPercentage={module.profilesRatioSettings.graphicType === "PERCENTAGE"}
            isEditing={rest.isEditing}
          />
        ) : null}
      </DashboardSimpleModuleCard>
    );
  }),
  {
    fragments: {
      DashboardProfilesRatioModule: gql`
        fragment DashboardProfilesRatioModule_DashboardProfilesRatioModule on DashboardProfilesRatioModule {
          ...DashboardSimpleModuleCard_DashboardModule
          profilesRatioResult: result {
            items {
              count
              aggr
            }
            isIncongruent
          }
          profilesRatioSettings: settings {
            graphicType
            type
            profileTypeId
            filters {
              ...fullDashboardModuleProfileFilter
            }
          }
        }
        ${fullDashboardModuleProfileFilter}
        ${DashboardSimpleModuleCard.fragments.DashboardModule}
      `,
    },
  },
);
