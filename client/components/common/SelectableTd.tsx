import {
  Center,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  SystemStyleObject,
  Td,
  Tr,
} from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { Box, HStack } from "@parallel/components/ui";
import { createContext, useContext } from "react";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";

type SelectableTrControlType = "CHECKBOX" | "RADIO";

interface SelectableTdProps {
  value: string;
  isDisabled?: boolean;
  _control?: SystemStyleObject;
  _content?: SystemStyleObject;
}

export const SelectableTd = chakraComponent<"td", SelectableTdProps>(function SelectableTd({
  ref,
  value,
  isDisabled,
  _control,
  _content,
  children,
  ...props
}) {
  const type = useContext(SelectableTrTypeContext);
  assert(isNonNullish(type), "SelectableTd must be used within a SelectableTr");
  return (
    <>
      {/* These 2 height="100%" make the HStack be full cell height. height="1px" on Table is needed too */}
      <Td ref={ref} paddingY={0} paddingX={2} height="100%" {...props}>
        <HStack as="label" height="100%" alignItems="start">
          <Center height="40px" sx={_control}>
            {type === "RADIO" ? (
              <Radio value={value} isDisabled={isDisabled} />
            ) : (
              <Checkbox value={value} isDisabled={isDisabled} />
            )}
          </Center>
          <Box flex={1} minWidth={0} paddingY={2} minHeight="40px" sx={_content}>
            {children}
          </Box>
        </HStack>
      </Td>
    </>
  );
});

interface SelectableTrProps {
  labelId: string;
  isDisabled?: boolean;
  type: "CHECKBOX" | "RADIO";
  value: string | string[] | undefined;
  onChange: (value: string | string[] | undefined) => void;
}

export const SelectableTr = chakraComponent<"tr", SelectableTrProps>(function SelectableTr({
  ref,
  labelId,
  type,
  value,
  onChange,
  isDisabled,
  children,
  ...props
}) {
  if (type === "CHECKBOX") {
    assert(Array.isArray(value), 'value must be an array if type="CHECKBOX"');
    return (
      <SelectableTrTypeContext.Provider value={type}>
        <CheckboxGroup value={value} isDisabled={isDisabled} onChange={onChange as any}>
          <Tr ref={ref} group="role" aria-labelledby={labelId} {...props}>
            {children}
          </Tr>
        </CheckboxGroup>
      </SelectableTrTypeContext.Provider>
    );
  } else {
    assert(
      typeof value === "undefined" || typeof value === "string",
      'value must be string | undefined if type="RADIO"',
    );
    return (
      <SelectableTrTypeContext.Provider value={type}>
        <RadioGroup
          ref={ref}
          as={Tr}
          value={value}
          isDisabled={isDisabled}
          onChange={onChange}
          aria-labelledby={labelId}
          {...(props as any)}
        >
          {children}
        </RadioGroup>
      </SelectableTrTypeContext.Provider>
    );
  }
});

const SelectableTrTypeContext = createContext<SelectableTrControlType | null>(null);
