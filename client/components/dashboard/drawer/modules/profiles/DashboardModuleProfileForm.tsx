import { gql, useQuery } from "@apollo/client";
import { FormControl } from "@chakra-ui/react";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { DashboardModuleProfileForm_profileTypeDocument } from "@parallel/graphql/__types";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { DashboardModuleFormLabel } from "../../components/DashboardModuleFormLabel";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";
import { getDefaultFilters } from "../../utils/moduleUtils";
import { ProfilesChartModuleSettings } from "./ProfilesChartModuleSettings";
import { ProfilesNumberModuleSettings } from "./ProfilesNumberModuleSettings";
import { ProfilesRatioModuleSettings } from "./ProfilesRatioModuleSettings";

export function DashboardModuleProfileForm() {
  const { control, watch, setValue } = useFormContext<DashboardModuleDrawerFormData>();
  const selectedModule = watch("selectedModule");
  const moduleType = selectedModule!.type;
  const profileTypeId = watch("settings.profileTypeId");
  const settingsType = watch("settings.type");

  const { data } = useQuery(DashboardModuleProfileForm_profileTypeDocument, {
    variables: { profileTypeId: profileTypeId ?? "" },
    skip: isNullish(profileTypeId),
    fetchPolicy: "no-cache",
  });

  const profileTypeFields = data?.profileType?.fields ?? [];

  const resultTypes = useSimpleSelectOptions((intl) => {
    return [
      {
        value: "COUNT",
        label: intl.formatMessage({
          id: "component.dashboard-module-form.module-result-type-count",
          defaultMessage: "Count",
        }),
      },
      ...(moduleType === "DashboardProfilesNumberModule"
        ? [
            {
              value: "AVG",
              label: intl.formatMessage({
                id: "component.dashboard-module-form.module-result-type-average",
                defaultMessage: "Average",
              }),
            },
            {
              value: "MAX",
              label: intl.formatMessage({
                id: "component.dashboard-module-form.module-result-type-max",
                defaultMessage: "Maximum",
              }),
            },
            {
              value: "MIN",
              label: intl.formatMessage({
                id: "component.dashboard-module-form.module-result-type-min",
                defaultMessage: "Minimum",
              }),
            },
          ]
        : []),
      {
        value: "SUM",
        label: intl.formatMessage({
          id: "component.dashboard-module-form.module-result-type-sum",
          defaultMessage: "Sum",
        }),
      },
    ];
  }, []);

  return (
    <>
      <Controller
        name="settings.profileTypeId"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { value, onChange }, fieldState: { error, isDirty } }) => (
          <FormControl isInvalid={isNonNullish(error)}>
            <DashboardModuleFormLabel field="settings.profileTypeId">
              <FormattedMessage
                id="component.dashboard-module-form.module-profile-type"
                defaultMessage="Profile type"
              />
            </DashboardModuleFormLabel>
            <ProfileTypeSelect
              defaultOptions
              value={value ?? null}
              onChange={(v) => {
                onChange(v?.id ?? "");
                if (value !== v?.id) {
                  setValue("settings.filters", getDefaultFilters(moduleType), {
                    shouldDirty: true,
                  });
                  setValue("settings.profileTypeFieldId", undefined, {
                    shouldDirty: true,
                  });
                  setValue("settings.type", "COUNT", {
                    shouldDirty: true,
                  });
                }
              }}
            />
          </FormControl>
        )}
      />

      <Controller
        name="settings.type"
        control={control}
        rules={{
          required: isNonNullish(profileTypeId),
        }}
        render={({ field: { value, onChange }, fieldState: { error, isDirty } }) => (
          <FormControl isDisabled={isNullish(profileTypeId)} isInvalid={isNonNullish(error)}>
            <DashboardModuleFormLabel field="settings.type">
              <FormattedMessage
                id="component.dashboard-module-form.module-result-type"
                defaultMessage="Result type"
              />
            </DashboardModuleFormLabel>
            <SimpleSelect options={resultTypes as any} value={value ?? null} onChange={onChange} />
          </FormControl>
        )}
      />
      {settingsType && settingsType !== "COUNT" ? (
        <Controller
          name="settings.profileTypeFieldId"
          control={control}
          rules={{
            required: isNonNullish(profileTypeId),
          }}
          render={({ field: { onChange, value }, fieldState: { error, isDirty } }) => (
            <FormControl isDisabled={isNullish(profileTypeId)} isInvalid={isNonNullish(error)}>
              <DashboardModuleFormLabel field="settings.profileTypeFieldId">
                <FormattedMessage
                  id="component.dashboard-module-form.module-field-to-aggregate"
                  defaultMessage="Field to aggregate"
                />
              </DashboardModuleFormLabel>
              <ProfileTypeFieldSelect
                value={profileTypeFields.find((f) => f.id === value) as any}
                fields={profileTypeFields}
                filterFields={(f) => f.type === "NUMBER"}
                onChange={(v) => onChange(v?.id)}
              />
            </FormControl>
          )}
        />
      ) : null}

      {moduleType === "DashboardProfilesNumberModule" ? (
        <ProfilesNumberModuleSettings
          key={profileTypeId}
          profileType={data?.profileType}
          isDisabled={isNullish(profileTypeId)}
        />
      ) : null}
      {moduleType === "DashboardProfilesRatioModule" ? (
        <ProfilesRatioModuleSettings
          key={profileTypeId}
          profileType={data?.profileType}
          isDisabled={isNullish(profileTypeId)}
        />
      ) : null}
      {moduleType === "DashboardProfilesPieChartModule" ? (
        <ProfilesChartModuleSettings
          key={profileTypeId}
          profileType={data?.profileType}
          isDisabled={isNullish(profileTypeId)}
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
    ${ProfileTypeFieldSelect.fragments.ProfileTypeField}
    ${ProfilesChartModuleSettings.fragments.ProfileType}
    ${ProfilesRatioModuleSettings.fragments.ProfileType}
    ${ProfilesNumberModuleSettings.fragments.ProfileType}
  `,
];
