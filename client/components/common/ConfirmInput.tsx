import { FormControl, FormControlProps, FormLabel, Input, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { usePreviousValue } from "beautiful-react-hooks";
import { ChangeEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface ConfirmInputProps extends Omit<FormControlProps, "onChange"> {
  confirmation?: string;
  onChange?: (value: boolean | undefined) => void;
  name?: string;
}
export const ConfirmInput = chakraForwardRef<"div", ConfirmInputProps>(function ConfirmInput(
  { confirmation: _confirmation, onChange, onBlur, name, ...props },
  ref
) {
  const intl = useIntl();
  const confirmation =
    _confirmation ??
    intl
      .formatMessage({
        id: "generic.delete",
        defaultMessage: "Delete",
      })
      .toLocaleLowerCase(intl.locale);
  const [value, setValue] = useState("");
  const prevValue = usePreviousValue(value);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    const match = e.target.value === confirmation;
    const prevMatch = prevValue === confirmation;
    if (match && !prevMatch) {
      onChange?.(true);
    } else if (!match && prevMatch) {
      onChange?.(undefined);
    }
  };
  return (
    <FormControl ref={ref} {...props}>
      <FormLabel>
        <Text color={props.isInvalid ? "red.500" : "inherit"}>
          <FormattedMessage
            id="generic.type-to-confirm"
            defaultMessage="Please type {confirmation} to confirm"
            values={{
              confirmation: <Text as="strong">{confirmation}</Text>,
            }}
          />
        </Text>
      </FormLabel>
      <Input
        name={name}
        aria-label={intl.formatMessage(
          {
            id: "generic.type-to-confirm",
            defaultMessage: "Please type {confirmation} to confirm",
          },
          { confirmation }
        )}
        value={value}
        placeholder={confirmation}
        onChange={handleChange}
      />
    </FormControl>
  );
});
