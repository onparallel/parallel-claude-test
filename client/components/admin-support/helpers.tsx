import {
  IntrospectionEnumType,
  IntrospectionInputObjectType,
  IntrospectionInputTypeRef,
  IntrospectionInputValue,
  IntrospectionNamedTypeRef,
  IntrospectionType,
} from "graphql";
import { isDefined } from "remeda";

export function findNamedTypeRef<T extends IntrospectionType>(
  type: IntrospectionNamedTypeRef<T>,
  schemaTypes: readonly IntrospectionType[]
): T {
  return schemaTypes.find((t) => t.kind === type.kind && t.name === type.name) as T;
}

function getDefaultInputObjectTypeValue(
  type: IntrospectionNamedTypeRef<IntrospectionInputObjectType>,
  schemaTypes: readonly IntrospectionType[]
) {
  const { inputFields } = findNamedTypeRef(type, schemaTypes);

  return Object.fromEntries(
    inputFields.map((f) => [f.name, getDefaultInputTypeValue(f.type, schemaTypes)])
  );
}

export function getDefaultInputTypeValue(
  type: IntrospectionInputTypeRef,
  schemaTypes: readonly IntrospectionType[],
  defaultValue?: any
): any {
  switch (type.kind) {
    case "NON_NULL":
      return getDefaultInputTypeValue(type.ofType, schemaTypes, defaultValue);
    case "ENUM":
      return (
        schemaTypes.find(
          (t) => t.kind === type.kind && t.name === type.name
        ) as IntrospectionEnumType
      ).enumValues[0].name;
    case "INPUT_OBJECT":
      return getDefaultInputObjectTypeValue(
        type as IntrospectionNamedTypeRef<IntrospectionInputObjectType>,
        schemaTypes
      );
    case "SCALAR":
      if (type.name === "Upload") {
        return null;
      } else if (type.name === "Boolean") {
        return isDefined(defaultValue) ? defaultValue === "true" : false;
      }
      return "";
    default:
      return "";
  }
}

export function isArgRequired(arg: IntrospectionInputValue) {
  return arg.type.kind !== "NON_NULL";
}
