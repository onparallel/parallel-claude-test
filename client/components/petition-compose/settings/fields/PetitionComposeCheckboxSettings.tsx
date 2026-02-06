import { gql } from "@apollo/client";
import {
  Box,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
} from "@chakra-ui/react";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { StandardListSelect } from "@parallel/components/common/StandardListSelect";
import { Text } from "@parallel/components/ui";
import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { getMinMaxCheckboxLimit } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useConfirmOverwriteOptionsDialog } from "../../dialogs/ConfirmOverwriteOptionsDialog";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { ImportOptionsSettingsRow } from "../rows/ImportOptionsSettingsRow";
import { SettingsRow } from "../rows/SettingsRow";
import { SettingsRowSwitch } from "../rows/SettingsRowSwitch";

type CheckboxLimitType = "UNLIMITED" | "EXACT" | "RANGE" | "RADIO";

export function PetitionComposeCheckboxSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 400, [field.id]);

  const values = field.options?.values ?? [];
  const [limitType, setLimitType] = useState<CheckboxLimitType>(
    field.options?.limit?.type ?? "UNLIMITED",
  );
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(1);

  const refMin = useRef<HTMLInputElement>(null);
  const refMax = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== refMin?.current && document.activeElement !== refMax?.current) {
      setMin(field.options?.limit?.min);
      setMax(field.options?.limit?.max);
    }
  }, [field.options.limit]);

  const options = useSimpleSelectOptions((intl) => {
    return [
      {
        label: intl.formatMessage({
          id: "component.petition-field-checkbox-settings.unlimited",
          defaultMessage: "Unlimited",
        }),
        value: "UNLIMITED",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-field-checkbox-settings.exact-number",
          defaultMessage: "Exact number",
        }),
        value: "EXACT",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-field-checkbox-settings.range",
          defaultMessage: "Range",
        }),
        value: "RANGE",
      },
    ];
  }, []);

  const handleMinOnChange = (_: never, value: number) => {
    if (Number.isNaN(value)) {
      setMin(0);
      return;
    }

    const [_min, _max] = getMinMaxCheckboxLimit({
      min: value,
      max: max || 1,
      valuesLength: values.length || 1,
      optional: field.optional,
    });

    if (_min !== min) {
      setMin(_min);
      debouncedOnUpdate(field.id, {
        options: {
          ...field.options,
          limit: {
            ...field.options.limit,
            min: _min,
            max: _max,
          },
        },
      });
    }
  };

  const handleMaxOnChange = (_: never, value: number) => {
    if (Number.isNaN(value)) {
      setMax(0);
      return;
    }

    const [_min, _max] = getMinMaxCheckboxLimit({
      min: min || 0,
      max: value || 1,
      valuesLength: values.length || 1,
      optional: field.optional,
    });

    setMin(_min);
    setMax(_max);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        limit: {
          ...field.options.limit,
          min: _min,
          max: _max,
        },
      },
    });
  };

  const showConfirmOverwriteOptionsDialog = useConfirmOverwriteOptionsDialog();

  const handleFieldEdit = async (data: UpdatePetitionFieldInput) => {
    try {
      if (
        field.options.values.length &&
        field.options?.standardList !== data.options?.standardList
      ) {
        await showConfirmOverwriteOptionsDialog();
      }
      onFieldEdit(field.id, data);
    } catch {}
  };

  return (
    <>
      <SettingsRow
        label={
          <FormattedMessage
            id="component.petition-compose-field-settings.list-of-options-label"
            defaultMessage="List of options"
          />
        }
        description={
          <Stack>
            <Text>
              <FormattedMessage
                id="component.petition-compose-field-settings.list-of-options-description-1"
                defaultMessage="Use our existing option lists to save time."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.petition-compose-field-settings.list-of-options-description-2"
                defaultMessage="These options will be fixed and not editable."
              />
            </Text>
          </Stack>
        }
        controlId="list-of-options"
        isDisabled={field.isLinkedToProfileTypeField || isReadOnly}
      >
        <Box flex={1}>
          <StandardListSelect
            isDisabled={field.isLinkedToProfileTypeField || isReadOnly}
            size="sm"
            isClearable
            value={field.options?.standardList ?? null}
            onChange={async (standardList) => {
              handleFieldEdit({
                options: {
                  ...field.options,
                  standardList,
                  values: [],
                  labels: null,
                  limit: {
                    type: "UNLIMITED",
                    min: field.optional ? 0 : 1,
                    max: 1,
                  },
                },
              });
            }}
          />
        </Box>
      </SettingsRow>
      <ImportOptionsSettingsRow
        field={field}
        onChange={handleFieldEdit}
        isDisabled={isReadOnly || field.isLinkedToProfileTypeField}
      />

      <SettingsRowSwitch
        isDisabled={isReadOnly || field.isLinkedToProfileTypeField}
        isChecked={limitType !== "RADIO"}
        onChange={(value) => {
          setLimitType(value ? "UNLIMITED" : "RADIO");
          debouncedOnUpdate(field.id, {
            options: {
              ...field.options,
              limit: {
                type: value ? "UNLIMITED" : "RADIO",
                min: field.optional ? 0 : 1,
                max: 1,
              },
            },
          });
        }}
        label={
          <FormattedMessage
            id="component.petition-compose-field-settings.multiple-label"
            defaultMessage="Allow more than one reply"
          />
        }
        description={
          <Text fontSize="sm">
            <FormattedMessage
              id="component.petition-compose-checkbox-settings.description"
              defaultMessage="This option allows you to limit the number of options that the recipient can choose."
            />
          </Text>
        }
        controlId="field-checkbox"
      >
        <Stack direction="row">
          <Box flex="1" minWidth="0">
            <SimpleSelect
              isDisabled={isReadOnly || field.isLinkedToProfileTypeField}
              options={options}
              value={limitType}
              isSearchable={false}
              onChange={(option) => {
                if (option && option !== limitType) {
                  setLimitType(option);
                  debouncedOnUpdate(field.id, {
                    options: {
                      ...field.options,
                      limit: {
                        ...field.options.limit,
                        type: option,
                      },
                    },
                  });
                }
              }}
            />
          </Box>

          {limitType === "RANGE" && (
            <NumberInput
              value={min}
              min={field.optional ? 0 : 1}
              max={Number(max) > 1 ? Number(max) - 1 : field.optional ? 0 : 1}
              width={"72px"}
              onChange={handleMinOnChange}
              allowMouseWheel={true}
              isDisabled={isReadOnly || field.isLinkedToProfileTypeField}
            >
              <NumberInputField ref={refMin} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          )}

          {(limitType === "EXACT" || limitType === "RANGE") && (
            <NumberInput
              value={max}
              min={limitType === "EXACT" ? 1 : Number(min)}
              max={field.options.values.length ?? 1}
              width={"72px"}
              onChange={handleMaxOnChange}
              allowMouseWheel={true}
              isDisabled={isReadOnly || field.isLinkedToProfileTypeField}
            >
              <NumberInputField ref={refMax} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          )}
        </Stack>
      </SettingsRowSwitch>
    </>
  );
}

const _fragments = {
  PetitionField: gql`
    fragment PetitionComposeCheckboxSettings_PetitionField on PetitionField {
      id
      options
      optional
      isLinkedToProfileTypeField
    }
  `,
};
