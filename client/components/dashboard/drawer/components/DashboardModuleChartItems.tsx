import { gql } from "@apollo/client";
import { Box, FormControl, FormErrorMessage, HStack, Input, Stack } from "@chakra-ui/react";
import { AddIcon, DeleteIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { Button, Text } from "@parallel/components/ui";
import { DashboardModuleChartItems_ProfileTypeFragment } from "@parallel/graphql/__types";
import { useRerender } from "@parallel/utils/useRerender";
import { Fragment, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import type { DashboardModuleFormData } from "../DashboardModuleForm";
import {
  defaultDashboardModulePetitionFilter,
  defaultDashboardModuleProfileFilter,
} from "../utils/moduleUtils";
import { DashboardModuleFormLabel } from "./DashboardModuleFormLabel";
import { PetitionsModuleFilterEditor } from "./PetitionsModuleFilterEditor";
import { ProfilesModuleFilterEditor } from "./ProfilesModuleFilterEditor";

export function DashboardModuleChartItems({
  isProfileTypeModule,
  profileType,
  isDisabled,
  isUpdating,
}: {
  isProfileTypeModule?: boolean;
  profileType?: DashboardModuleChartItems_ProfileTypeFragment;
  isDisabled?: boolean;
  isUpdating?: boolean;
}) {
  const intl = useIntl();
  const {
    control,
    register,
    getValues,
    formState: { errors },
    trigger,
  } = useFormContext<DashboardModuleFormData>();

  const [selectedIndex, setSelectedFieldIndex] = useState(0);
  const [key, rerenderSelect] = useRerender();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "settings.items",
    rules: { required: true },
    shouldUnregister: true,
  });

  const handleAddNewChartItem = async () => {
    // No validation needed if there are no items yet
    if (fields.length > 0) {
      const isValid = await trigger(`settings.items.${selectedIndex}.filters.0`, {
        shouldFocus: true,
      });
      if (!isValid) {
        return;
      }
    }
    append({
      label: intl.formatMessage(
        {
          id: "component.petitions-chart-module-settings.item-default-label",
          defaultMessage: "Item {index}",
        },
        { index: fields.length + 1 },
      ),
      filters: [
        isProfileTypeModule
          ? defaultDashboardModuleProfileFilter()
          : defaultDashboardModulePetitionFilter(),
      ],

      color: "#000000",
    });
    if (fields.length >= 0) {
      setSelectedFieldIndex(fields.length);
    }
  };

  const profileTypeFields = profileType?.fields ?? [];
  return (
    <>
      <FormControl>
        <DashboardModuleFormLabel field="settings.items" isUpdating={isUpdating}>
          <FormattedMessage
            id="component.petitions-chart-module-settings.chart-items-label"
            defaultMessage="Chart items"
          />
        </DashboardModuleFormLabel>

        {fields.length ? (
          <HStack spacing={2}>
            <Box flex="1">
              <SimpleSelect
                key={key}
                options={fields.map((_, index) => ({
                  label: getValues(`settings.items.${index}.label`),
                  value: `${index}`,
                }))}
                value={`${selectedIndex}`}
                onChange={async (value) => {
                  const isValid = await trigger("settings.items", { shouldFocus: true });
                  if (isValid) {
                    setSelectedFieldIndex(parseInt(value!));
                  }
                }}
              />
            </Box>
            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "component.petitions-chart-module-settings.add-item-button",
                defaultMessage: "Add item",
              })}
              icon={<AddIcon />}
              onClick={handleAddNewChartItem}
              disabled={isDisabled}
            />

            <IconButtonWithTooltip
              label={intl.formatMessage({ id: "generic.delete", defaultMessage: "Delete" })}
              icon={<DeleteIcon />}
              onClick={() => {
                remove(selectedIndex);
                setSelectedFieldIndex(Math.max(0, selectedIndex - 1));
              }}
              disabled={isDisabled || fields.length <= 1}
              placement="bottom-end"
            />
          </HStack>
        ) : (
          <FormControl isInvalid={!!errors.settings?.items}>
            <Stack spacing={3}>
              <Text textStyle="hint">
                <FormattedMessage
                  id="component.petitions-chart-module-settings.no-chart-items-added"
                  defaultMessage="No chart items added"
                />
              </Text>
              <Box>
                <Button
                  variant="outline"
                  size="sm"
                  fontSize="md"
                  fontWeight={500}
                  leftIcon={
                    <PlusCircleFilledIcon color="primary.500" position="relative" boxSize={5} />
                  }
                  onClick={handleAddNewChartItem}
                  disabled={isDisabled}
                >
                  <FormattedMessage
                    id="component.petitions-chart-module-settings.add-item-button"
                    defaultMessage="Add item"
                  />
                </Button>
              </Box>
              <FormErrorMessage>
                <FormattedMessage
                  id="component.dashboard-module-form.error-chart-items-required"
                  defaultMessage="Chart items are required"
                />
              </FormErrorMessage>
            </Stack>
          </FormControl>
        )}
      </FormControl>
      {fields.map((field, index) =>
        index === selectedIndex ? (
          <Fragment key={field.id}>
            <HStack alignItems="flex-start">
              <FormControl width="auto">
                <DashboardModuleFormLabel field={[]}>
                  <FormattedMessage
                    id="component.petitions-chart-module-settings.item-color"
                    defaultMessage="Color"
                  />
                </DashboardModuleFormLabel>
                <Input
                  type="color"
                  padding={1}
                  {...register(`settings.items.${selectedIndex}.color`)}
                />
              </FormControl>
              <FormControl flex={1} isInvalid={!!errors.settings?.items?.[selectedIndex]?.label}>
                <DashboardModuleFormLabel
                  field={[
                    `settings.items.${selectedIndex}.label`,
                    `settings.items.${selectedIndex}.color`,
                  ]}
                  isUpdating={isUpdating}
                >
                  <FormattedMessage
                    id="component.petitions-chart-module-settings.item-label"
                    defaultMessage="Label"
                  />
                </DashboardModuleFormLabel>
                <Input
                  {...register(`settings.items.${selectedIndex}.label`, {
                    required: true,
                  })}
                  onBlur={() => rerenderSelect()}
                />

                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.required-field-error"
                    defaultMessage="The field is required"
                  />
                </FormErrorMessage>
              </FormControl>
            </HStack>
            <Text textTransform="uppercase" color="gray.600" fontSize="sm" fontWeight={500}>
              <FormattedMessage id="generic.dashboard-module-filters" defaultMessage="Filters" />:
            </Text>
            {isProfileTypeModule ? (
              <ProfilesModuleFilterEditor
                profileTypeFields={profileTypeFields}
                field={`settings.items.${selectedIndex}.filters.0`}
                isUpdating={isUpdating}
              />
            ) : (
              <PetitionsModuleFilterEditor
                field={`settings.items.${selectedIndex}.filters.0`}
                isUpdating={isUpdating}
              />
            )}
          </Fragment>
        ) : (
          <Fragment key={field.id}></Fragment>
        ),
      )}
    </>
  );
}

const _fragments = {
  ProfileType: gql`
    fragment DashboardModuleChartItems_ProfileType on ProfileType {
      id
      fields {
        id
        name
        options
        type
        ...ProfilesModuleFilterEditor_ProfileTypeField
      }
    }
  `,
};
