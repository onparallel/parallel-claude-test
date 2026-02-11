import { FormErrorMessage, FormErrorMessageProps, Input } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { Maybe } from "@parallel/utils/types";
import { ShortTextFormat } from "@parallel/utils/useShortTextFormats";
import { useImperativeHandle, useRef } from "react";
import { IMaskInput } from "react-imask";
import { FormattedMessage } from "react-intl";

interface ShortTextInput {
  onChange: (value: string) => void;
  format?: Maybe<ShortTextFormat>;
}

export const ShortTextInput = chakraComponent<"input", ShortTextInput>(function ShortTextInput({
  ref,
  format,
  onChange,
  ...props
}) {
  const inputRef = useRef<any>(null);
  useImperativeHandle(ref, () => {
    if (format?.type === "MASK") {
      return inputRef.current?.element;
    } else {
      return inputRef.current;
    }
  }, [format?.type]);
  return (
    <Input
      ref={inputRef}
      {...(format?.type === "MASK"
        ? {
            as: IMaskInput,
            ...format.maskProps,
            onAccept: (value: string) => {
              if (value !== props.value) {
                onChange(value);
              }
            },
          }
        : {
            onChange: (e) => onChange(e.target.value),
          })}
      {...format?.inputProps}
      {...props}
    />
  );
});

export const FormatFormErrorMessage = chakraComponent<
  "div",
  Omit<FormErrorMessageProps, "children"> & {
    format: ShortTextFormat;
  }
>(function FormatFormErrorMessage({ ref, format, ...props }) {
  return (
    <FormErrorMessage ref={ref} {...props}>
      <FormattedMessage
        id="component.recipient-view-petition-field-short-text.format-error"
        defaultMessage="Please, enter a valid {format}."
        values={{ format: format.label }}
      />
    </FormErrorMessage>
  );
});
