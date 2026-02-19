import { gql } from "@apollo/client";
import { FormControl, FormErrorMessage, Radio, RadioGroup } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { Stack, Text } from "@parallel/components/ui";
import { ProfilesChartModuleSettings_ProfileTypeFragment } from "@parallel/graphql/__types";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardModuleChartItems } from "../../components/DashboardModuleChartItems";
import { DashboardModuleChartType } from "../../components/DashboardModuleChartType";
import { DashboardModuleFormLabel } from "../../components/DashboardModuleFormLabel";
import { ProfilesModuleFilterEditor } from "../../components/ProfilesModuleFilterEditor";
import { defaultDashboardModuleProfileFilter } from "../../utils/moduleUtils";

export function ProfilesChartModuleSettings({
  profileType,
  isDisabled,
  isUpdating,
}: {
  profileType?: ProfilesChartModuleSettings_ProfileTypeFragment;
  isDisabled?: boolean;
  isUpdating?: boolean;
}) {
  const profileTypeFields = profileType?.fields ?? [];
  const { control, watch, resetField } = useFormContext();

  const groupByProfileTypeFieldId = watch("settings.groupByProfileTypeFieldId");
  const [radioValue, setRadioValue] = useState(
    isNonNullish(groupByProfileTypeFieldId) ? "GROUP_BY_PROFILE_TYPE_FIELD" : "CUSTOM_ITEMS",
  );
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
        <DashboardModuleFormLabel
          field="settings.groupByProfileTypeFieldId"
          isUpdating={isUpdating}
        >
          <FormattedMessage
            id="component.petitions-chart-module-settings.source-chart-items-label"
            defaultMessage="Source of chart items"
          />
        </DashboardModuleFormLabel>

        <RadioGroup
          onChange={(value) => {
            if (value === "CUSTOM_ITEMS") {
              resetField("settings.groupByProfileTypeFieldId", { defaultValue: null });
              resetField("settings.groupByFilter", {
                defaultValue: defaultDashboardModuleProfileFilter(),
              });
            } else {
              resetField("settings.items", { defaultValue: [] });
            }
            setRadioValue(value);
          }}
          value={radioValue}
          isDisabled={isDisabled}
        >
          <Stack>
            <Radio value="CUSTOM_ITEMS">
              <FormattedMessage
                id="component.petitions-chart-module-settings.custom-chart-items"
                defaultMessage="Custom chart items"
              />
            </Radio>
            <Radio value="GROUP_BY_PROFILE_TYPE_FIELD">
              <FormattedMessage
                id="component.petitions-chart-module-settings.from-profile-type-field-chart-items"
                defaultMessage="From profile property"
              />
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>
      {radioValue === "CUSTOM_ITEMS" ? (
        <DashboardModuleChartItems
          isProfileTypeModule
          profileType={profileType}
          isDisabled={isDisabled}
          isUpdating={isUpdating}
        />
      ) : (
        <>
          <Controller
            name="settings.groupByProfileTypeFieldId"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isInvalid={isNonNullish(error)}>
                <ProfileTypeFieldSelect
                  value={profileTypeFields.find((f) => f.id === value) as any}
                  fields={profileTypeFields}
                  filterFields={(f) => f.type === "SELECT" || f.type === "USER_ASSIGNMENT"}
                  onChange={(v) => onChange(v?.id)}
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

          <Divider />
          <Text textTransform="uppercase" color="gray.600" fontSize="sm" fontWeight={500}>
            <FormattedMessage
              id="component.profiles-chart-module-settings.global-filter"
              defaultMessage="Global filters"
            />
            :
          </Text>
          <ProfilesModuleFilterEditor
            field="settings.groupByFilter"
            profileTypeFields={profileTypeFields}
            isDisabled={isDisabled}
            isUpdating={isUpdating}
          />
        </>
      )}
    </>
  );
}

const _fragments = {
  ProfileType: gql`
    fragment ProfilesChartModuleSettings_ProfileType on ProfileType {
      id
      fields {
        id
        ...ProfileTypeFieldSelect_ProfileTypeField
        ...ProfilesModuleFilterEditor_ProfileTypeField
      }
      ...DashboardModuleChartItems_ProfileType
    }
  `,
};
