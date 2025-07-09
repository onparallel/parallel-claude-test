import { gql } from "@apollo/client";
import { FormControl, Radio, RadioGroup, Stack, Text } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { ProfilesChartModuleSettings_ProfileTypeFragment } from "@parallel/graphql/__types";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardModuleChartItems } from "../../components/DashboardModuleChartItems";
import { DashboardModuleChartType } from "../../components/DashboardModuleChartType";
import { DashboardModuleFormLabel } from "../../components/DashboardModuleFormLabel";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";
import { ProfilesFiltersModuleSettings } from "./ProfilesFiltersModuleSettings";

export function ProfilesChartModuleSettings({
  profileType,
  isDisabled,
}: {
  profileType?: ProfilesChartModuleSettings_ProfileTypeFragment;
  isDisabled?: boolean;
}) {
  const profileTypeFields = profileType?.fields ?? [];
  const { control, watch } = useFormContext<DashboardModuleDrawerFormData>();

  const groupByProfileTypeFieldId = watch("settings.groupByProfileTypeFieldId");
  const [radioValue, setRadioValue] = useState(isNonNullish(groupByProfileTypeFieldId) ? "2" : "1");
  return (
    <>
      <FormControl>
        <DashboardModuleFormLabel field="settings.chartGraphicType">
          <FormattedMessage
            id="component.petitions-chart-module-settings.chart-type-label"
            defaultMessage="Chart type"
          />
        </DashboardModuleFormLabel>
        <Controller
          name="settings.chartGraphicType"
          defaultValue="PIE"
          control={control}
          render={({ field: { value, onChange } }) => (
            <DashboardModuleChartType value={value} onChange={onChange} />
          )}
        />
      </FormControl>
      <FormControl>
        <DashboardModuleFormLabel>
          <FormattedMessage
            id="component.petitions-chart-module-settings.source-chart-items-label"
            defaultMessage="Source of chart items"
          />
        </DashboardModuleFormLabel>

        <RadioGroup onChange={setRadioValue} value={radioValue} isDisabled={isDisabled}>
          <Stack>
            <Radio value="1">
              <FormattedMessage
                id="component.petitions-chart-module-settings.custom-chart-items"
                defaultMessage="Custom chart items"
              />
            </Radio>
            <Radio value="2">
              <FormattedMessage
                id="component.petitions-chart-module-settings.from-profile-type-field-chart-items"
                defaultMessage="From profile property"
              />
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>
      {radioValue === "1" ? (
        <DashboardModuleChartItems
          key="1"
          isProfileTypeModule
          profileType={profileType}
          isDisabled={isDisabled}
        />
      ) : (
        <>
          <FormControl>
            <Controller
              name="settings.groupByProfileTypeFieldId"
              control={control}
              rules={{
                required: radioValue === "2",
              }}
              shouldUnregister
              render={({ field: { onChange, value } }) => (
                <ProfileTypeFieldSelect
                  value={profileTypeFields.find((f) => f.id === value) as any}
                  fields={profileTypeFields}
                  filterFields={(f) => f.type === "SELECT"}
                  onChange={(v) => onChange(v?.id)}
                />
              )}
            />
          </FormControl>
          <Divider />
          <Text fontWeight={600}>
            <FormattedMessage
              id="component.dashboard-module-form.chart-filters"
              defaultMessage="Chart filters"
            />
            :
          </Text>
          <ProfilesFiltersModuleSettings
            profileTypeFields={profileTypeFields}
            isDisabled={isDisabled}
          />
        </>
      )}
    </>
  );
}

ProfilesChartModuleSettings.fragments = {
  ProfileType: gql`
    fragment ProfilesChartModuleSettings_ProfileType on ProfileType {
      id
      fields {
        id
        ...ProfileTypeFieldSelect_ProfileTypeField
        ...ProfilesFiltersModuleSettings_ProfileTypeField
      }
      ...DashboardModuleChartItems_ProfileType
    }
    ${ProfileTypeFieldSelect.fragments.ProfileTypeField}
    ${DashboardModuleChartItems.fragments.ProfileType}
    ${ProfilesFiltersModuleSettings.fragments.ProfileTypeField}
  `,
};
