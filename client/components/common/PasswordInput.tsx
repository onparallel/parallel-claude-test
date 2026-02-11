import { Input, InputGroup, InputProps, InputRightElement } from "@chakra-ui/react";
import { EyeIcon, EyeOffIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { useRef, useState } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

export const PasswordInput = chakraComponent<"input", InputProps>(function PasswordInput({
  ref,
  ...props
}) {
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs(ref, inputRef);
  const intl = useIntl();

  const labels = {
    hide: intl.formatMessage({
      id: "generic.hide",
      defaultMessage: "Hide",
    }),
    show: intl.formatMessage({
      id: "generic.show",
      defaultMessage: "Show",
    }),
  };

  function handleClick() {
    inputRef.current!.focus();
    setShow(!show);
  }

  return (
    <InputGroup size="md">
      <Input ref={mergedRef} paddingEnd={12} type={show ? "text" : "password"} {...props} />
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
