import { gql } from "@apollo/client";
import { DashboardProfilesNumberModule_DashboardProfilesNumberModuleFragment } from "@parallel/graphql/__types";
import {
  ProfileFieldValuesFilterGroup,
  simplifyProfileFieldValuesFilter,
} from "@parallel/utils/ProfileFieldValuesFilter";
import { buildProfilesQueryStateUrl } from "@parallel/utils/profilesQueryState";
import { forwardRef, useMemo } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  cleanDashboardModuleProfileFilter,
  fullDashboardModuleProfileFilter,
} from "../../drawer/utils/moduleUtils";
import { DashboardLinkToResults } from "../../shared/DashboardLinkToResults";
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
    const intl = useIntl();

    const resultsUrls = useMemo(() => {
      const { status, values } = cleanDashboardModuleProfileFilter(
        module.profilesNumberSettings.filters,
      );
      const valueFilter = {
        logicalOperator: "AND",
        conditions: [],
      } as ProfileFieldValuesFilterGroup;
      if (isNonNullish(values)) {
        valueFilter.conditions.push(values);
      }
      if (module.profilesNumberSettings.type === "AGGREGATE") {
        // when aggregating, we need to add a filter to exclude profiles without a value
        valueFilter.conditions.push({
          profileTypeFieldId: module.profilesNumberSettings.profileTypeFieldId!,
          operator: "HAS_VALUE",
          value: null,
        });
      }
      return buildProfilesQueryStateUrl({
        view: "-ALL", // this forces ALL instead of the default view
        type: module.profilesNumberSettings.profileTypeId,
        status,
        values:
          valueFilter.conditions.length > 0 ? simplifyProfileFieldValuesFilter(valueFilter) : null,
      });
    }, [module]);

    return (
      <DashboardSimpleModuleCard
        ref={ref}
        module={module}
        headerAddon={
          <DashboardLinkToResults
            href={resultsUrls}
            label={intl.formatMessage({
              id: "generic.view-profiles",
              defaultMessage: "View profiles",
            })}
          />
        }
        {...rest}
      >
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
      get DashboardProfilesNumberModule() {
        return gql`
          fragment DashboardProfilesNumberModule_DashboardProfilesNumberModule on DashboardProfilesNumberModule {
            ...DashboardSimpleModuleCard_DashboardModule
            profilesNumberResult: result {
              count
              aggr
            }
            profilesNumberSettings: settings {
              type
              profileTypeId
              profileTypeFieldId
              filters {
                ...fullDashboardModuleProfileFilter
              }
            }
          }
          ${fullDashboardModuleProfileFilter}
          ${DashboardSimpleModuleCard.fragments.DashboardModule}
        `;
      },
    },
  },
);
