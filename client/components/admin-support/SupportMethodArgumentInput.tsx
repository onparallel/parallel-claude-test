import {
  Flex,
  Grid,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Switch,
  Text,
} from "@chakra-ui/react";
import { unCamelCase } from "@parallel/utils/strings";
import {
  IntrospectionEnumType,
  IntrospectionInputObjectType,
  IntrospectionInputValue,
  IntrospectionNamedTypeRef,
  IntrospectionType,
} from "graphql";
import { findNamedTypeRef } from "./helpers";

type SupportMethodArgumentInputProps = {
  arg: IntrospectionInputValue;
  isInvalid?: boolean;
  schemaTypes: readonly IntrospectionType[];
  value: any;
  onValue: (value: any) => void;
};

export function SupportMethodArgumentInput(props: SupportMethodArgumentInputProps) {
  const type = props.arg.type.kind === "NON_NULL" ? props.arg.type.ofType : props.arg.type;
  switch (type.kind) {
    case "SCALAR":
      return (
        <>
          <Text as="label" lineHeight={10}>
            {unCamelCase(props.arg.name)}
          </Text>
          <ScalarInput {...props} />
        </>
      );
    case "ENUM":
      return (
        <>
          <Text as="label" lineHeight={10}>
            {unCamelCase(props.arg.name)}
          </Text>
          <EnumInput {...props} />
        </>
      );
    case "INPUT_OBJECT":
      return (
        <>
          <Text as="label" lineHeight={10} gridColumn="1/3">
            {unCamelCase(props.arg.name)}
          </Text>
          <ObjectInput {...props} />
        </>
      );
    default:
      console.error(`Can't build input of type ${type.kind}:`, props.arg);
      return <Input disabled isInvalid />;
  }
}

function ScalarInput({ arg, value, isInvalid, onValue }: SupportMethodArgumentInputProps) {
  const type =
    arg.type.kind === "NON_NULL"
      ? (arg.type.ofType as IntrospectionNamedTypeRef)
      : (arg.type as IntrospectionNamedTypeRef);

  switch (type.name) {
    case "Upload":
      return (
        <Input
          width="100%"
          type="file"
          isInvalid={isInvalid}
          onChange={(e) => e.target.files && onValue(e.target.files[0])}
        />
      );
    case "Boolean":
      return (
        <Flex alignItems="center">
          <Switch
            isInvalid={isInvalid}
            isChecked={value}
            onChange={(event) => onValue(event.target.checked)}
          />
          <Text marginLeft={2}>{arg.description}</Text>
        </Flex>
      );
    case "Int":
    case "Float":
      return (
        <NumberInput
          width="100%"
          isInvalid={isInvalid}
          value={value}
          onChange={(_, value) => (Number.isNaN(value) ? null : onValue(value))}
        >
          <NumberInputField placeholder={arg.description ?? ""} />
        </NumberInput>
      );
    default:
      return (
        <Input
          placeholder={arg.description ?? ""}
          width="100%"
          isInvalid={isInvalid}
          value={value}
          onChange={(e) => onValue(e.target.value || null)}
        />
      );
  }
}

function EnumInput({
  arg,
  value,
  isInvalid,
  schemaTypes,
  onValue,
}: SupportMethodArgumentInputProps) {
  const { enumValues } = findNamedTypeRef(
    arg.type.kind === "NON_NULL"
      ? (arg.type.ofType as IntrospectionNamedTypeRef<IntrospectionEnumType>)
      : (arg.type as IntrospectionNamedTypeRef<IntrospectionEnumType>),
    schemaTypes
  );

  return (
    <Select isInvalid={isInvalid} value={value} onChange={(e) => onValue(e.currentTarget.value)}>
      {enumValues.map(({ name }) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </Select>
  );
}

function ObjectInput({
  arg,
  value,
  isInvalid,
  schemaTypes,
  onValue,
}: SupportMethodArgumentInputProps) {
  const { inputFields } = findNamedTypeRef(
    arg.type.kind === "NON_NULL"
      ? (arg.type.ofType as IntrospectionNamedTypeRef<IntrospectionInputObjectType>)
      : (arg.type as IntrospectionNamedTypeRef<IntrospectionInputObjectType>),
    schemaTypes
  );
  return (
    <Grid templateColumns="84px 1fr" gridColumn="1/3" rowGap={2} columnGap={2} marginLeft={4}>
      {inputFields.map((field) => (
        <SupportMethodArgumentInput
          key={field.name}
          arg={field}
          schemaTypes={schemaTypes}
          value={value[field.name]}
          isInvalid={false}
          onValue={(v) => onValue({ ...value, [field.name]: v })}
        />
      ))}
    </Grid>
  );
}
