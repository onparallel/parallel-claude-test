/** @jsx jsx */
import {
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  InputRightElement,
  useColorMode,
} from "@chakra-ui/core";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { forwardRef, Ref, useRef } from "react";
import { useIntl } from "react-intl";
import { jsx, css } from "@emotion/core";

export type SearchInputProps = InputProps &
  Required<Pick<InputProps, "value" | "onChange">>;

export const SearchInput = forwardRef(function SearchInput(
  { ...props }: SearchInputProps,
  ref: Ref<HTMLInputElement>
) {
  const { colorMode } = useColorMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs(ref, inputRef);
  const intl = useIntl();
  const [focused, bind] = useFocus<HTMLInputElement>(props);
  const isActive = Boolean(props.value || focused);

  const clearLabel = intl.formatMessage({
    id: "component.input.clear-button",
    defaultMessage: "Clear",
  });

  function handleClearClick() {
    const input = inputRef.current!;
    setNativeValue(input, "");
    input.focus();
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
            defaultMessage: "Search...",
          })
        }
        {...props}
        {...bind}
        css={css`
          &::-ms-clear,
          &::-ms-reveal {
            display: none;
            width: 0;
            height: 0;
          }

          &::-webkit-search-decoration,
          &::-webkit-search-cancel-button,
          &::-webkit-search-results-button,
          &::-webkit-search-results-decoration {
            display: none;
          }
        `}
      />
      {isActive ? (
        <InputRightElement>
          <IconButton
            tabIndex={-1}
            title={clearLabel}
            aria-label={clearLabel}
            icon="close"
            size="xs"
            variant="ghost"
            onClick={handleClearClick}
          ></IconButton>
        </InputRightElement>
      ) : null}
    </InputGroup>
  );
});
