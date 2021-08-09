import { Input, InputGroup, InputProps, InputRightElement } from "@chakra-ui/react";
import { EyeIcon, EyeOffIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import useMergedRef from "@react-hook/merged-ref";
import { useRef, useState } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

export const PasswordInput = chakraForwardRef<"input", InputProps>(function PasswordInput(
  props,
  ref
) {
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);
  const intl = useIntl();

  const labels = {
    hide: intl.formatMessage({
      id: "component.password-input.hide",
      defaultMessage: "Hide",
    }),
    show: intl.formatMessage({
      id: "component.password-input.show",
      defaultMessage: "Show",
    }),
  };

  function handleClick() {
    inputRef.current!.focus();
    setShow(!show);
  }

  return (
    <InputGroup size="md">
      <Input ref={mergedRef} paddingRight={12} type={show ? "text" : "password"} {...props} />
      <InputRightElement>
        <IconButtonWithTooltip
          tabIndex={-1}
          icon={show ? <EyeOffIcon /> : <EyeIcon />}
          label={show ? labels.hide : labels.show}
          placement="bottom"
          size="sm"
          variant="ghost"
          onClick={handleClick}
        />
      </InputRightElement>
    </InputGroup>
  );
});
