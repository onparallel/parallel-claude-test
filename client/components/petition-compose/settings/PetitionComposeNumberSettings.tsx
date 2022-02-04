import {
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Text,
} from "@chakra-ui/react";
import { SwitchSetting } from "@parallel/components/petition-common/PetitionSettings";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";

export function NumberSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 1000, [field.id]);

  const [min, setMin] = useState<number | undefined>(undefined);
  const [max, setMax] = useState<number | undefined>(undefined);

  const [limitIsActive, setLimitIsActive] = useState(field.options?.range?.isActive ?? false);

  const refMin = useRef<HTMLInputElement>(null);
  const refMax = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== refMin?.current && document.activeElement !== refMax?.current) {
      setMin(field.options?.range?.min);
      setMax(field.options?.range?.max);
    }
  }, [field.options.range]);

  const handleMinOnChange = (_: never, value: number) => {
    if (Number.isNaN(value)) {
      setMin(_);

      const rangeMax = max !== undefined ? { max } : {};

      debouncedOnUpdate(field.id, {
        options: {
          ...field.options,
          range: {
            isActive: field.options.range.isActive,
            ...rangeMax,
          },
        },
      });
      return;
    }
    const _min = Number(value);

    if (_min !== min) {
      const _max = max !== undefined && _min >= max ? _min + 1 : max;

      setMin(_min);
      setMax(_max);
      debouncedOnUpdate(field.id, {
        options: {
          ...field.options,
          range: {
            ...field.options.range,
            min: _min,
            max: _max,
          },
        },
      });
    }
  };

  const handleMaxOnChange = (_: never, value: number) => {
    if (Number.isNaN(value)) {
      setMax(_);

      const rangeMin = min !== undefined ? { min } : {};

      debouncedOnUpdate(field.id, {
        options: {
          ...field.options,
          range: {
            isActive: field.options.range.isActive,
            ...rangeMin,
          },
        },
      });
      return;
    }

    const _max = Number(value);
    const _min = min !== undefined && min >= _max ? _max - 1 : min;

    setMin(_min);
    setMax(_max);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        range: {
          ...field.options.range,
          min: _min,
          max: _max,
        },
      },
    });
  };

  return (
    <SwitchSetting
      label={
        <FormattedMessage
          id="component.field-settings-number.add-range"
          defaultMessage="Add range"
        />
      }
      description={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.field-settings-number.add-range-description"
            defaultMessage="Enabling this option will allow you to limit the recipient's response to a minimum or maximum amount."
          />
        </Text>
      }
      isChecked={limitIsActive}
      onChange={(checked: boolean) => {
        setLimitIsActive(checked);
        debouncedOnUpdate(field.id, {
          options: {
            ...field.options,
            range: {
              ...field.options.range,
              isActive: checked,
            },
          },
        });
      }}
      isDisabled={isReadOnly}
      controlId="field-number-range"
    >
      <Stack direction="row" wrap="wrap" gridGap={2} spacing={0}>
        <HStack flex="1">
          <Text minWidth="2.2rem">
            <FormattedMessage
              id="component.field-settings-number.add-range-min"
              defaultMessage="Min."
            />
          </Text>
          <NumberInput
            value={min}
            onChange={handleMinOnChange}
            allowMouseWheel={true}
            isDisabled={isReadOnly}
            flex="1"
            minWidth="10rem"
          >
            <NumberInputField ref={refMin} placeholder="∞" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </HStack>
        <HStack flex="1">
          <Text minWidth="2.2rem">
            <FormattedMessage
              id="component.field-settings-number.add-range-max"
              defaultMessage="Max."
            />
          </Text>
          <NumberInput
            value={max}
            onChange={handleMaxOnChange}
            allowMouseWheel={true}
            isDisabled={isReadOnly}
            flex="1"
            minWidth="10rem"
          >
            <NumberInputField ref={refMax} placeholder="∞" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </HStack>
      </Stack>
    </SwitchSetting>
  );
}
