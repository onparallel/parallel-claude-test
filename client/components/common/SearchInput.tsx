import {
  CloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  InputRightElement,
} from "@chakra-ui/react";
import { SearchIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import useMergedRef from "@react-hook/merged-ref";
import { useRef } from "react";
import { useIntl } from "react-intl";

export const SearchInput = chakraForwardRef<"input", InputProps>(
  function SearchInput(props, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = useMergedRef(ref, inputRef);
    const intl = useIntl();
    const [focused, bind] = useFocus<HTMLInputElement>(props);
    const isActive = Boolean(props.value || focused);

    function handleClearClick() {
      const input = inputRef.current!;
      setNativeValue(input, "");
      input.focus();
    }

    return (
      <InputGroup size="md">
        <InputLeftElement>
          <SearchIcon color={isActive ? "gray.800" : "gray.400"} />
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
          sx={{
            "::-ms-clear, ::-ms-reveal": {
              display: "none",
              width: 0,
              height: 0,
            },
            "::-webkit-search-decoration": { display: "none" },
            "::-webkit-search-cancel-button": { display: "none" },
            "::-webkit-search-results-button": { display: "none" },
            "::-webkit-search-results-decoration": { display: "none" },
          }}
        />
        {isActive ? (
          <InputRightElement>
            <CloseButton
              tabIndex={-1}
              aria-label={intl.formatMessage({
                id: "generic.clear",
                defaultMessage: "Clear",
              })}
              size="sm"
              onClick={handleClearClick}
            />
          </InputRightElement>
        ) : null}
      </InputGroup>
    );
  }
);
