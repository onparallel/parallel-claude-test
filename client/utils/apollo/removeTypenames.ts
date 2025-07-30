import { mapValues, omit } from "remeda";
import { Prettify } from "../types";

type GraphQLObject = Record<string, any>;
type GraphQLScalar = string | number | boolean | undefined | null;
type GraphQLPrimitive = GraphQLScalar | GraphQLPrimitive[];

type WithoutTypenames<T extends GraphQLPrimitive | GraphQLObject> = T extends GraphQLPrimitive
  ? T
  : Prettify<{
      [K in keyof T as K extends "__typename" ? never : K]: T[K] extends GraphQLPrimitive
        ? T[K]
        : T[K] extends (infer U extends GraphQLObject)[]
          ? WithoutTypenames<U>[]
          : T[K] extends GraphQLObject | undefined | null
            ? WithoutTypenames<T[K]>
            : never;
    }>;

export function removeTypenames<T extends GraphQLPrimitive | GraphQLObject>(
  obj: T,
): WithoutTypenames<T> {
  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean" ||
    obj === null ||
    obj === undefined
  ) {
    return obj as any;
  } else if (Array.isArray(obj)) {
    return obj.map(removeTypenames) as any;
  } else {
    return mapValues(omit(obj, ["__typename"] as any), (value) => removeTypenames(value)) as any;
  }
}
