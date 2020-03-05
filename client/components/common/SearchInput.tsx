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
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useFocus } from "@parallel/utils/useFocus";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { ChangeEvent, forwardRef, Ref, useRef, useState } from "react";
import { useIntl } from "react-intl";

export type SearchInputProps = InputProps &
  Required<Pick<InputProps, "value" | "onChange">>;

export const SearchInput = forwardRef(function SearchInput(
  { value: _value, onChange: _onChange, ...props }: SearchInputProps,
  ref: Ref<HTMLInputElement>
) {
  const { colorMode } = useColorMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs(ref, inputRef);
  const intl = useIntl();
  const [focused, bind] = useFocus<HTMLInputElement>(props);
  const [value, setValue] = useState(_value);
  const isActive = Boolean(value || focused);
  const onChange = useDebouncedCallback(_onChange!, 300, []);

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

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    if ((e.nativeEvent as any)._fromClearClick) {
      _onChange(e);
    } else {
      e.persist();
      onChange(e);
    }
  }

  return (
    <InputGroup size="md">
      <InputLeftElement>
        <Icon
          name="search"
          color={
            isActive
              ? { light: "gray.800", dark: "whiteAlpha.900" }[colorMode]
              : { light: "gray.400", dark: "whiteAlpha.400" }[colorMode]
          }
        />
      </InputLeftElement>
      <Input
        ref={mergedRef}
        paddingRight={isActive ? 12 : undefined}
        paddingLeft={12}
        type="search"
        placeholder={
          props.placeholder ||
          intl.formatMessage({
            id: "component.search-input.placeholder",
            defaultMessage: "Search..."
          })
        }
        value={value}
        onChange={handleChange}
        {...props}
        {...bind}
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
