import {
  IconButton,
  Input,
  InputGroup,
  InputProps,
  InputRightElement
} from "@chakra-ui/core";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { forwardRef, Ref, useRef, useState } from "react";
import { useIntl } from "react-intl";

export const PasswordInput = forwardRef(function PasswordInput(
  props: InputProps,
  ref: Ref<HTMLInputElement>
) {
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs(ref, inputRef);
  const intl = useIntl();

  const labels = {
    hide: intl.formatMessage({
      id: "component.password-input.hide",
      defaultMessage: "Hide"
    }),
    show: intl.formatMessage({
      id: "component.password-input.show",
      defaultMessage: "Show"
    })
  };

  function handleClick() {
    inputRef.current!.focus();
    setShow(!show);
  }

  return (
    <InputGroup size="md">
      <Input
        ref={mergedRef}
        paddingRight={12}
        type={show ? "text" : "password"}
        {...props}
      />
      <InputRightElement>
        <IconButton
          tabIndex={-1}
          title={show ? labels.hide : labels.show}
          aria-label={show ? labels.hide : labels.show}
          icon={show ? "view-off" : "view"}
          size="sm"
          variant="ghost"
          onClick={handleClick}
        ></IconButton>
      </InputRightElement>
    </InputGroup>
  );
});
