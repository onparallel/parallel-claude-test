import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { FormControl, FormErrorMessage } from "@chakra-ui/react";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import {
  SimpleOption,
  SimpleSelect,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import {
  DashboardModuleProfileForm_profileTypeDocument,
  ModuleResultAggregateType,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { DashboardModuleFormLabel } from "../../components/DashboardModuleFormLabel";
import { DashboardModuleType } from "../../hooks/useDashboardModules";
import { defaultDashboardModuleProfileFilter } from "../../utils/moduleUtils";
import { ProfilesChartModuleSettings } from "./ProfilesChartModuleSettings";
import { ProfilesNumberModuleSettings } from "./ProfilesNumberModuleSettings";
import { ProfilesRatioModuleSettings } from "./ProfilesRatioModuleSettings";

export function DashboardModuleProfileForm({
  moduleType,
  isUpdating,
}: {
  moduleType: DashboardModuleType;
  isUpdating?: boolean;
}) {
  const { control, watch, resetField } = useFormContext();
  const profileTypeId = watch("settings.profileTypeId");
  const settingsType = watch("settings.type");

  const { data } = useQuery(DashboardModuleProfileForm_profileTypeDocument, {
    variables: { profileTypeId: profileTypeId ?? "" },
    skip: isNullish(profileTypeId),
  });

  const profileTypeFields = useMemo(() => {
    return isNullish(profileTypeId)
      ? []
      : data?.profileType.id === profileTypeId
        ? data!.profileType!.fields
        : [];
  }, [profileTypeId, data]);

  const resultTypes = useSimpleSelectOptions<ModuleResultAggregateType | "COUNT">(
    (intl) => [
      {
        value: "COUNT",
        label: intl.formatMessage({
          id: "generic.aggregate-count",
          defaultMessage: "Count",
        }),
      },
      {
        value: "SUM",
        label: intl.formatMessage({
          id: "generic.aggregate-sum",
          defaultMessage: "Sum",
        }),
      },
      ...(moduleType === "DashboardProfilesNumberModule"
        ? ([
            {
              value: "AVG",
              label: intl.formatMessage({
                id: "generic.aggregate-average",
                defaultMessage: "Average",
              }),
            },
            {
              value: "MAX",
              label: intl.formatMessage({
                id: "generic.aggregate-max",
                defaultMessage: "Maximum",
              }),
            },
            {
              value: "MIN",
              label: intl.formatMessage({
                id: "generic.aggregate-min",
                defaultMessage: "Minimum",
              }),
            },
          ] as SimpleOption<ModuleResultAggregateType>[])
        : []),
    ],
    [],
  );

  return (
    <>
      <Controller
        name="settings.profileTypeId"
        control={control}
        rules={{ required: true }}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <FormControl isInvalid={isNonNullish(error)}>
            <DashboardModuleFormLabel field="settings.profileTypeId" isUpdating={isUpdating}>
              <FormattedMessage
                id="component.dashboard-module-profile-form.profile-type-label"
                defaultMessage="Profile type"
              />
            </DashboardModuleFormLabel>
            <ProfileTypeSelect
              defaultOptions
              value={value ?? null}
              onChange={(pt) => {
                assert(isNonNullish(pt));
                onChange(pt.id);
                if (value !== pt.id) {
                  resetField("settings.type", { defaultValue: "COUNT" });
                  resetField("settings.profileTypeFieldId", { defaultValue: null });
                  if (moduleType === "DashboardProfilesNumberModule") {
                    resetField("settings.filters", {
                      defaultValue: [defaultDashboardModuleProfileFilter()],
                    });
                  } else if (moduleType === "DashboardProfilesRatioModule") {
                    resetField("settings.filters", {
                      defaultValue: [
                        defaultDashboardModuleProfileFilter(),
                        defaultDashboardModuleProfileFilter(),
                      ],
                    });
                  } else if (moduleType === "DashboardProfilesPieChartModule") {
                    resetField("settings.items", { defaultValue: [] });
                    resetField("settings.groupByProfileTypeFieldId", { defaultValue: null });
                    resetField("settings.groupByFilter", {
                      defaultValue: defaultDashboardModuleProfileFilter(),
                    });
                  }
                }
              }}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.required-field-error"
                defaultMessage="The field is required"
              />
            </FormErrorMessage>
          </FormControl>
        )}
      />
      <Controller
        name="settings.type"
        control={control}
        rules={{ required: isNonNullish(profileTypeId) }}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <FormControl isDisabled={isNullish(profileTypeId)} isInvalid={isNonNullish(error)}>
            <DashboardModuleFormLabel field="settings.type" isUpdating={isUpdating}>
              <FormattedMessage
                id="component.dashboard-module-profile-form.result-type-label"
                defaultMessage="Result type"
              />
            </DashboardModuleFormLabel>
            <SimpleSelect options={resultTypes} value={value ?? null} onChange={onChange} />
          </FormControl>
        )}
      />
      {settingsType !== "COUNT" ? (
        <Controller
          name="settings.profileTypeFieldId"
          control={control}
          rules={{ required: isNonNullish(profileTypeId) }}
          shouldUnregister
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <FormControl isDisabled={isNullish(profileTypeId)} isInvalid={isNonNullish(error)}>
              <DashboardModuleFormLabel field="settings.profileTypeFieldId" isUpdating={isUpdating}>
                <FormattedMessage
                  id="component.dashboard-module-profile-form.aggregate-by-label"
                  defaultMessage="Field to aggregate"
                />
              </DashboardModuleFormLabel>
              <ProfileTypeFieldSelect
                value={profileTypeFields.find((f) => f.id === value) as any}
                fields={profileTypeFields}
                filterFields={(f) => f.type === "NUMBER"}
                onChange={(v) => onChange(v!.id)}
              />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.required-field-error"
                  defaultMessage="The field is required"
                />
              </FormErrorMessage>
            </FormControl>
          )}
        />
      ) : null}

      {moduleType === "DashboardProfilesNumberModule" ? (
        <ProfilesNumberModuleSettings
          profileType={data?.profileType}
          isDisabled={isNullish(profileTypeId)}
          isUpdating={isUpdating}
        />
      ) : null}
      {moduleType === "DashboardProfilesRatioModule" ? (
        <ProfilesRatioModuleSettings
          profileType={data?.profileType}
          isDisabled={isNullish(profileTypeId)}
          isUpdating={isUpdating}
        />
      ) : null}
      {moduleType === "DashboardProfilesPieChartModule" ? (
        <ProfilesChartModuleSettings
          profileType={data?.profileType}
          isDisabled={isNullish(profileTypeId)}
          isUpdating={isUpdating}
        />
      ) : null}
    </>
  );
}

const _queries = [
  gql`
    query DashboardModuleProfileForm_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        id
        name
        fields {
          id
          ...ProfileTypeFieldSelect_ProfileTypeField
        }
        ...ProfilesChartModuleSettings_ProfileType
        ...ProfilesRatioModuleSettings_ProfileType
        ...ProfilesNumberModuleSettings_ProfileType
      }
    }
  `,
];
