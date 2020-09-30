import { Text, Input, Select, Stack, Flex } from "@chakra-ui/core";
import {
  IntrospectionEnumType,
  IntrospectionInputObjectType,
  IntrospectionInputValue,
  IntrospectionType,
} from "graphql";
import { ChangeEvent, useCallback, useMemo, useState } from "react";

export type ArgumentWithState = IntrospectionInputValue & {
  inputValue: any;
  position: number;
  error?: boolean;
  required: boolean;
  list?: boolean;
};

type ArgumentInputProps = {
  argument: ArgumentWithState;
  schemaTypes: readonly IntrospectionType[];
  onChange: (value: ArgumentWithState) => void;
};

function getDefaultObjectValues(
  arg: IntrospectionInputValue,
  schemaTypes: readonly IntrospectionType[]
) {
  const { inputFields } = schemaTypes.find(
    (type) => type.kind === arg.type.kind && type.name === arg.type.name
  ) as IntrospectionInputObjectType;

  const data: { [key: string]: any } = {};
  inputFields.forEach((field) => {
    data[field.name] = getDefaultInputValue(field, schemaTypes);
  });
  return data;
}

export function getDefaultInputValue(
  arg: IntrospectionInputValue,
  schemaTypes: readonly IntrospectionType[]
): any {
  switch (arg.type.kind) {
    case "NON_NULL":
      return getDefaultInputValue(
        { ...arg, type: arg.type.ofType },
        schemaTypes
      );
    case "ENUM":
      return (schemaTypes.find(
        (type) => type.kind === arg.type.kind && type.name === arg.type.name
      ) as IntrospectionEnumType).enumValues[0].name;
    case "INPUT_OBJECT":
      return getDefaultObjectValues(arg, schemaTypes);
    default:
      return "";
  }
}

function renderInputType(props: ArgumentInputProps): any {
  switch (props.argument.type.kind) {
    case "NON_NULL":
      return renderInputType({
        ...props,
        argument: {
          ...props.argument,
          type: props.argument.type.ofType,
        },
      });
    case "LIST":
      return renderInputType({
        ...props,
        argument: {
          ...props.argument,
          type: props.argument.type.ofType,
          list: true,
        },
      });
    case "SCALAR":
      return props.argument.type.name === "Upload" ? (
        <FileUploadInput {...props} />
      ) : (
        <ScalarInput {...props} />
      );
    case "ENUM":
      return <EnumInput {...props} />;
    case "INPUT_OBJECT":
      return <ObjectInput {...props} />;
    default:
      console.error(
        `Can't build input of type ${(props.argument.type as any).kind}:`,
        props.argument
      );
      return <Input disabled isInvalid />;
  }
}

export function ArgumentInput(props: ArgumentInputProps) {
  const { argument } = props;
  if (!argument.inputValue) {
    argument.inputValue = getDefaultInputValue(argument, props.schemaTypes);
  }

  return renderInputType(props);
}

function FileUploadInput(props: ArgumentInputProps) {
  const { argument } = props;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { argument } = props;
    if (e.target.files) {
      props.onChange({
        ...argument,
        inputValue: e.target.files[0],
      });
    }
  };

  return (
    <Flex justifyContent="space-between" alignItems="center" width="100%">
      <Text marginRight={2} minWidth="100px">
        {argument.name}
      </Text>
      <Input
        width="100%"
        type="file"
        isInvalid={argument.error}
        onChange={handleInputChange}
      />
    </Flex>
  );
}

function ScalarInput(props: ArgumentInputProps) {
  const { argument } = props;

  const type =
    argument.type.kind === "SCALAR" && argument.type.name === "Int"
      ? "number"
      : "text";

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { argument } = props;
    props.onChange({
      ...argument,
      inputValue:
        type === "number" ? parseInt(e.target.value, 10) : e.target.value,
    });
  };

  return (
    <Flex justifyContent="space-between" alignItems="center" width="100%">
      <Text marginRight={2} minWidth="100px">
        {argument.name}
      </Text>
      <Input
        placeholder={argument.description ?? ""}
        width="100%"
        type={type}
        isInvalid={argument.error}
        value={argument.inputValue}
        onChange={handleInputChange}
      />
    </Flex>
  );
}

function EnumInput(props: ArgumentInputProps) {
  const { argument, schemaTypes } = props;
  const { enumValues } = schemaTypes.find(
    (type) =>
      type.kind === argument.type.kind && type.name === argument.type.name
  ) as IntrospectionEnumType;

  const options = enumValues.map((value) => value.name);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      props.onChange({ ...argument, inputValue: e.currentTarget.value });
    },
    [argument]
  );

  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Text marginRight={2} minWidth="100px">
        {argument.name}
      </Text>
      <Select onChange={handleChange}>
        {options.map((option, i) => (
          <option key={i} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </Flex>
  );
}

function ObjectInput(props: ArgumentInputProps) {
  const { argument, schemaTypes } = props;
  const { inputFields } = schemaTypes.find(
    (type) =>
      type.kind === argument.type.kind && type.name === argument.type.name
  ) as IntrospectionInputObjectType;

  const objectArgs: ArgumentWithState[] = useMemo(
    () =>
      inputFields.map((field, i) => ({
        ...field,
        inputValue: argument.inputValue[field.name],
        position: i,
        required: field.type.kind === "NON_NULL",
      })),
    [argument]
  );

  const [args, setArgs] = useState(objectArgs);

  const handleChange = useCallback(
    (value: ArgumentWithState) => {
      const newArgs = args
        .filter((arg) => arg.name !== value.name)
        .concat(value)
        .sort((a, b) => a.position - b.position);

      setArgs(newArgs);

      const newInputValue: { [key: string]: any } = {};
      newArgs.forEach((arg) => {
        newInputValue[arg.name] = arg.inputValue;
      });
      newInputValue[value.name] = value.inputValue;
      props.onChange({
        ...argument,
        inputValue: newInputValue,
      });
    },
    [args, setArgs]
  );

  return (
    <Stack>
      {args.map((arg, i) => (
        <Flex key={i} alignItems="center">
          <Text marginRight={2} minWidth="100px">
            {argument.name}.
          </Text>
          <ArgumentInput
            {...props}
            argument={{ ...arg, error: argument.error }}
            onChange={handleChange}
          />
        </Flex>
      ))}
    </Stack>
  );
}
