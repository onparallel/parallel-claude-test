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
import { useFieldSelectReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import {
  PetitionComposeFieldSettingsProps,
  SettingsRow,
} from "../PetitionComposeFieldSettings";

export function CheckboxSettings({
  field,
  onFieldEdit,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit">) {
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
  const [type, setType] = useState(field.options?.limit?.type ?? "UNLIMITED");
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(1);

  const refMin = useRef<HTMLInputElement>(null);
  const refMax = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      document.activeElement !== refMin?.current &&
      document.activeElement !== refMax?.current
    ) {
      setMin(field.options?.limit?.min ?? 1);
      setMax(field.options?.limit?.max ?? 1);
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
    if (Number(value) != Number(min)) {
      setMin(Number(value));
      debouncedOnUpdate(field.id, {
        options: {
          ...field.options,
          limit: {
            ...field.options.limit,
            min: Number(value),
          },
        },
      });
    }
  };

  const handleMaxOnChange = (value: string) => {
    if (Number(value) != Number(max)) {
      const _max = Number(value);
      const _min = min === _max ? min - 1 || 1 : min;

      setMin(Number(_min));
      setMax(Number(_max));
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

  const handleChangeSelect = (_selected) => {
    if (_selected.value != selected?.value) {
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
                  min: 1,
                  max: 1,
                },
              },
            });
          }}
        />
      </SettingsRow>
      {type !== "RADIO" ? (
        <Stack direction="row">
          <Box flex={1}>
            <Select
              options={options}
              value={selected}
              onChange={handleChangeSelect}
              {...reactSelectProps}
            />
          </Box>

          {type === "RANGE" && (
            <NumberInput
              value={min}
              min={1}
              max={max - 1 || 1}
              w={"64px"}
              onChange={handleMinOnChange}
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
              min={type === "EXACT" ? 1 : min}
              max={field.options.values.length ?? 1}
              w={"64px"}
              onChange={handleMaxOnChange}
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
