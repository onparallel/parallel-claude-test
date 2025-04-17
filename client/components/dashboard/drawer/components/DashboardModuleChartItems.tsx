import { gql } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { DashboardModuleChartItems_ProfileTypeFragment } from "@parallel/graphql/__types";
import { useRerender } from "@parallel/utils/useRerender";
import { Fragment, useCallback, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { DashboardModuleDrawerFormData } from "../DashboardModuleDrawer";
import { PetitionsFiltersModuleSettings } from "../modules/petitions/PetitionsFiltersModuleSettings";
import { ProfilesFiltersModuleSettings } from "../modules/profiles/ProfilesFiltersModuleSettings";
import { DashboardModuleFormLabel } from "./DashboardModuleFormLabel";

export function DashboardModuleChartItems({
  isProfileTypeModule,
  profileType,
  isDisabled,
}: {
  isProfileTypeModule?: boolean;
  profileType?: DashboardModuleChartItems_ProfileTypeFragment;
  isDisabled?: boolean;
}) {
  const intl = useIntl();
  const {
    control,
    register,
    formState: { errors },
    getValues,
    trigger,
  } = useFormContext<DashboardModuleDrawerFormData>();

  const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);
  const [key, rerenderSelect] = useRerender();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "settings.items",
    rules: { required: true },
    shouldUnregister: true,
  });

  const chartItemsOptions = useSimpleSelectOptions(() => {
    return fields.map((field, index) => ({
      label: getValues(`settings.items.${index}.label`),
      value: field.id,
    }));
  }, [fields, key, getValues]);

  const handleAddNewChartItem = useCallback(async () => {
    // No validation needed if there are no items yet
    if (fields.length > 0) {
      const isValid = await trigger(`settings.items.${selectedFieldIndex}.filters.0`, {
        shouldFocus: true,
      });
      if (!isValid) return;
    }

    const newItem = {
      label: intl.formatMessage(
        {
          id: "component.petitions-chart-module-settings.item-default-label",
          defaultMessage: "Item {index}",
        },
        { index: fields.length + 1 },
      ),
      filters: [],
      color: "#000000",
    };

    append(newItem);
    if (fields.length >= 0) {
      setSelectedFieldIndex(fields.length);
    }
  }, [fields.length, selectedFieldIndex, trigger, intl, append]);

  const handleItemChange = useCallback(
    async (value: string) => {
      const isValid = await trigger(`settings.items.${selectedFieldIndex}.filters.0`, {
        shouldFocus: true,
      });
      if (!isValid) return;

      const index = fields.findIndex((field) => field.id === value);
      setSelectedFieldIndex(index);
    },
    [fields, selectedFieldIndex, trigger],
  );

  const handleRemoveChartItem = useCallback(async () => {
    remove(selectedFieldIndex);
    setSelectedFieldIndex(Math.max(0, selectedFieldIndex - 1));
  }, [remove, selectedFieldIndex]);

  const selectedField = getValues(`settings.items.${selectedFieldIndex}`);
  const profileTypeFields = profileType?.fields ?? [];
  return (
    <>
      <FormControl>
        <DashboardModuleFormLabel>
          <FormattedMessage
            id="component.petitions-chart-module-settings.chart-items-label"
            defaultMessage="Chart items"
          />
        </DashboardModuleFormLabel>

        {fields.length ? (
          <HStack spacing={2}>
            <Box flex="1">
              <SimpleSelect
                options={chartItemsOptions}
                value={fields[selectedFieldIndex]?.id}
                onChange={async (value) => await handleItemChange(value ?? "")}
              />
            </Box>
            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "component.petitions-chart-module-settings.add-item-button",
                defaultMessage: "Add item",
              })}
              icon={<AddIcon />}
              onClick={handleAddNewChartItem}
              isDisabled={isDisabled}
            />
            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "component.petitions-chart-module-settings.remove-item-button",
                defaultMessage: "Remove item",
              })}
              icon={<DeleteIcon />}
              onClick={handleRemoveChartItem}
              isDisabled={isDisabled || fields.length <= 1}
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
                  isDisabled={isDisabled}
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
      {fields.length > 0 && selectedField ? (
        <Fragment key={selectedFieldIndex}>
          <FormControl isInvalid={!!errors.settings?.items?.[selectedFieldIndex]?.label}>
            <DashboardModuleFormLabel field={`settings.items.${selectedFieldIndex}.label`}>
              <FormattedMessage
                id="component.petitions-chart-module-settings.item-label"
                defaultMessage="Label"
              />
            </DashboardModuleFormLabel>

            <Input
              {...register(`settings.items.${selectedFieldIndex}.label`, {
                required: true,
              })}
              onBlur={rerenderSelect}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.required-field-error"
                defaultMessage="The field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl>
            <DashboardModuleFormLabel field={`settings.items.${selectedFieldIndex}.color`}>
              <FormattedMessage
                id="component.petitions-chart-module-settings.item-color"
                defaultMessage="Color"
              />
            </DashboardModuleFormLabel>
            <Input type="color" {...register(`settings.items.${selectedFieldIndex}.color`)} />
          </FormControl>

          <Text fontWeight={600}>
            <FormattedMessage
              id="component.dashboard-module-form.filters-of"
              defaultMessage="Filters of {name}:"
              values={{ name: selectedField?.label ?? "" }}
            />
          </Text>
          {isProfileTypeModule ? (
            <ProfilesFiltersModuleSettings
              profileTypeFields={profileTypeFields}
              path={`settings.items.${selectedFieldIndex}.filters.0`}
            />
          ) : (
            <PetitionsFiltersModuleSettings
              path={`settings.items.${selectedFieldIndex}.filters.0`}
            />
          )}
        </Fragment>
      ) : null}
    </>
  );
}

DashboardModuleChartItems.fragments = {
  ProfileType: gql`
    fragment DashboardModuleChartItems_ProfileType on ProfileType {
      id
      fields {
        id
        name
        options
        type
        ...ProfilesFiltersModuleSettings_ProfileTypeField
      }
    }
    ${ProfilesFiltersModuleSettings.fragments.ProfileTypeField}
  `,
};
