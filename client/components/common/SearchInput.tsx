import {
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  InputRightElement,
  layoutPropNames,
} from "@chakra-ui/react";
import { SearchIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { useRef } from "react";
import { useIntl } from "react-intl";
import { omit, pick } from "remeda";
import { CloseButton } from "./CloseButton";

export const SearchInput = chakraComponent<"input", InputProps>(function SearchInput({ ref, ...props }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs(ref, inputRef);
  const intl = useIntl();
  const [focused, bind] = useFocus<HTMLInputElement>(props);
  const isActive = Boolean(props.value || focused);

  function handleClearClick() {
    const input = inputRef.current!;
    setNativeValue(input, "");
    input.focus();
  }

  const layoutProps = pick(props, layoutPropNames as any);
  const otherProps = omit(props, layoutPropNames as any);
  return (
    <InputGroup size="md" {...layoutProps}>
      <InputLeftElement>
        <SearchIcon color={isActive ? "gray.800" : "gray.400"} />
      </InputLeftElement>
      <Input
        ref={mergedRef}
        paddingEnd={isActive ? 12 : undefined}
        paddingStart={10}
        type="search"
        placeholder={
          props.placeholder ||
          intl.formatMessage({
            id: "component.search-input.placeholder",
            defaultMessage: "Search...",
          })
        }
        {...otherProps}
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
          <CloseButton tabIndex={-1} isClear onClick={handleClearClick} />
        </InputRightElement>
      ) : null}
    </InputGroup>
  );
});
