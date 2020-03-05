/** @jsx jsx */
import {
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  InputRightElement,
  useColorMode
} from "@chakra-ui/core";
import { css, jsx } from "@emotion/core";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { ChangeEvent, forwardRef, Ref, useEffect, useRef } from "react";
import { useIntl } from "react-intl";
import { maskInput } from "vanilla-text-mask";
import { useFocus } from "@parallel/utils/useFocus";

function p(value: number) {
  return value.toString().padStart(2, "0");
}

function serializeDate(value: Date | null) {
  if (value) {
    const { year, month, day, hours, minutes } = {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      hours: value.getHours(),
      minutes: value.getMinutes()
    };
    return `${year}-${p(month)}-${p(day)}T${p(hours)}:${p(minutes)}`;
  }
  return "";
}

export type DateTimeInputProps = Omit<InputProps, "value" | "onChange"> & {
  value?: Date | null;
  onChange?: (value: Date | null) => void;
};

export const DateTimeInput = forwardRef(function DateTimeInput(
  { value, onChange, isFullWidth, ...props }: DateTimeInputProps,
  ref: Ref<HTMLInputElement>
) {
  const intl = useIntl();
  const { colorMode } = useColorMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs(ref, inputRef);
  const [focused, bindFocus] = useFocus(props);
  const isActive = Boolean(value || focused);

  useEffect(() => {
    const input = inputRef.current!;
    input.type === "datetime-local";
    const supportsDatetimeLocal = input.type === "datetime-local";
    if (value) {
      if (supportsDatetimeLocal) {
        input.value = serializeDate(value);
      } else {
        input.value = serializeDate(value).replace("T", " ");
      }
    }
    if (!supportsDatetimeLocal) {
      const mask = maskInput({
        inputElement: input,
        mask: "0000-00-00 00:00".split("").map(c => (c === "0" ? /\d/ : c)),
        showMask: true,
        keepCharPositions: true,
        placeholderChar: "\u2000"
      });
      input.addEventListener("input", handleChangeNative);
      return () => {
        input.removeEventListener("input", handleChangeNative);
        mask.destroy();
      };
    }

    function handleChangeNative(this: HTMLInputElement, event: Event) {
      const value = this.value;
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          onChange?.(date);
        }
      } else if (value.replace(/\u2000/g, "") === "-- :") {
        onChange?.(null);
      }
    }
  }, []);

  const clearLabel = intl.formatMessage({
    id: "component.input.clear-button",
    defaultMessage: "Clear"
  });

  function handleClearClick() {
    const input = inputRef.current!;
    setNativeValue(input, "");
    const event = new Event("input", { bubbles: true });
    (event as any)._fromClearClick = true;
    input.dispatchEvent(event);
    input.focus();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const date = new Date(value);
    onChange?.(value && !isNaN(date.getTime()) ? date : null);
  }

  return (
    <InputGroup size="md" width={isFullWidth ? "100%" : "auto"}>
      <InputLeftElement pointerEvents="none">
        <Icon
          name="calendar"
          color={
            isActive
              ? { light: "gray.800", dark: "whiteAlpha.900" }[colorMode]
              : { light: "gray.400", dark: "whiteAlpha.400" }[colorMode]
          }
        />
      </InputLeftElement>
      <Input
        css={css`
          &::-webkit-clear-button {
            display: none;
          }
        `}
        ref={mergedRef}
        paddingRight={isActive ? 10 : undefined}
        paddingLeft={12}
        onChange={handleChange}
        {...bindFocus}
        {...props}
      />
      {isActive ? (
        <InputRightElement>
          <IconButton
            tabIndex={-1}
            title={clearLabel}
            aria-label={clearLabel}
            icon="close"
            size="sm"
            variant="ghost"
            onClick={handleClearClick}
          ></IconButton>
        </InputRightElement>
      ) : null}
    </InputGroup>
  );
});
