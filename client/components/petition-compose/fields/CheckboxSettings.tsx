import {
  Box,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { getMinMaxCheckboxLimit } from "@parallel/utils/petitionFields";
import { useFieldSelectReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptionType } from "@parallel/utils/react-select/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { PetitionComposeFieldSettingsProps, SettingsRow } from "../PetitionComposeFieldSettings";

export function CheckboxSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const intl = useIntl();

  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 180, [field.id]);
  const reactSelectProps = useFieldSelectReactSelectProps({});

  const [selected, setSelected] = useState({
    label: intl.formatMessage({
      id: "component.petition-field-checkbox-settings.unlimited",
      defaultMessage: "Unlimited",
    }),
    value: "UNLIMITED",
  });

  const values = field.options?.values ?? [];
  const [type, setType] = useState(field.options?.limit?.type ?? "UNLIMITED");
  const [min, setMin] = useState<number | "">(1);
  const [max, setMax] = useState<number | "">(1);

  const refMin = useRef<HTMLInputElement>(null);
  const refMax = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== refMin?.current && document.activeElement !== refMax?.current) {
      setMin(field.options?.limit?.min);
      setMax(field.options?.limit?.max);
    }
  }, [field.options.limit]);

  const options = useMemo(() => {
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
  }, [intl.locale]);

  useEffect(() => {
    let _selected = null;
    switch (type) {
      case "UNLIMITED":
        _selected = {
          label: intl.formatMessage({
            id: "component.petition-field-checkbox-settings.unlimited",
            defaultMessage: "Unlimited",
          }),
          value: "UNLIMITED",
        };
        break;

      case "EXACT":
        _selected = {
          label: intl.formatMessage({
            id: "component.petition-field-checkbox-settings.exact-number",
            defaultMessage: "Exact number",
          }),
          value: "EXACT",
        };
        break;

      case "RANGE":
        _selected = {
          label: intl.formatMessage({
            id: "component.petition-field-checkbox-settings.range",
            defaultMessage: "Range",
          }),
          value: "RANGE",
        };
        break;

      default:
        _selected = {
          label: intl.formatMessage({
            id: "component.petition-field-checkbox-settings.unlimited",
            defaultMessage: "Unlimited",
          }),
          value: "UNLIMITED",
        };
        break;
    }

    setSelected(_selected);
  }, [intl.locale, type]);

  const handleMinOnChange = (value: string) => {
    if (value === "") {
      setMin("");
      return;
    }

    const [_min, _max] = getMinMaxCheckboxLimit({
      min: Number(value) || 0,
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

  const handleMaxOnChange = (value: string) => {
    if (value === "") {
      setMax("");
      return;
    }

    const [_min, _max] = getMinMaxCheckboxLimit({
      min: min || 0,
      max: Number(value) || 1,
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

  const handleChangeSelect = (_selected: OptionType | null) => {
    if (_selected && _selected.value !== selected?.value) {
      setType(_selected.value);
      debouncedOnUpdate(field.id, {
        options: {
          ...field.options,
          limit: {
            ...field.options.limit,
            type: _selected.value,
          },
        },
      });

      setSelected(_selected);
    }
  };

  return (
    <Stack spacing={4}>
      <SettingsRow
        isDisabled={isReadOnly}
        label={
          <FormattedMessage
            id="field-settings.multiple-label"
            defaultMessage="Allow more than one reply"
          />
        }
        description={
          <Text fontSize="sm">
            <FormattedMessage
              id="field-settings.file-checbox-description"
              defaultMessage="This option allows you to limit the number of options that the recipient can choose."
            />
          </Text>
        }
        controlId="field-checkbox"
      >
        <Switch
          height="20px"
          display="block"
          id="field-checkbox"
          color="green"
          isChecked={type !== "RADIO"}
          onChange={(event) => {
            setType(event.target.checked ? "UNLIMITED" : "RADIO");
            debouncedOnUpdate(field.id, {
              options: {
                ...field.options,
                limit: {
                  type: event.target.checked ? "UNLIMITED" : "RADIO",
                  min: field.optional ? 0 : 1,
                  max: 1,
                },
              },
            });
          }}
          isDisabled={isReadOnly}
        />
      </SettingsRow>
      {type !== "RADIO" ? (
        <Stack direction="row">
          <Box flex={1}>
            <Select
              options={options}
              value={selected}
              isSearchable={false}
              onChange={handleChangeSelect}
              {...reactSelectProps}
              isDisabled={isReadOnly}
            />
          </Box>

          {type === "RANGE" && (
            <NumberInput
              value={min}
              min={field.optional ? 0 : 1}
              max={Number(max) > 1 ? Number(max) - 1 : field.optional ? 0 : 1}
              width={"72px"}
              onChange={handleMinOnChange}
              allowMouseWheel={true}
              isDisabled={isReadOnly}
            >
              <NumberInputField ref={refMin} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          )}
          {(type === "EXACT" || type === "RANGE") && (
            <NumberInput
              value={max}
              min={type === "EXACT" ? 1 : Number(min)}
              max={field.options.values.length ?? 1}
              width={"72px"}
              onChange={handleMaxOnChange}
              allowMouseWheel={true}
              isDisabled={isReadOnly}
            >
              <NumberInputField ref={refMax} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}
