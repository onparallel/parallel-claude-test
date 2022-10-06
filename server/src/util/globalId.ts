import { decode, encode } from "./token";
import { Maybe } from "./types";

export function isGlobalId(value: string, type?: string) {
  try {
    fromGlobalId(value, type);
    return true;
  } catch {
    return false;
  }
}

export function toGlobalId<TId extends number | string = number>(type: string, id: TId) {
  return encode(Buffer.from(`${type}:${id}`, "utf8"));
}

export function fromGlobalId<T extends string = string, IsStringId extends boolean = false>(
  globalId: string,
  type?: T,
  isString?: IsStringId
): { id: IsStringId extends true ? string : number; type: T } {
  let decoded: string;
  try {
    decoded = decode(globalId).toString("utf8");
  } catch {
    throw new Error("Invalid Global ID");
  }
  const [_type, id] = decoded.split(":");
  if (type && _type !== type) {
    throw new Error(`${globalId} is not a ${type}`);
  }
  if (!id || (!isString && !id.match(/^[1-9]\d*$/))) {
    throw new Error(`Invalid id ${globalId}`);
  }
  return {
    type: _type as T,
    id: isString ? (id as any) : parseInt(id, 10),
  };
}

export function fromGlobalIds<T extends string, IsStringId extends boolean = false>(
  globalIds: string[],
  type: T,
  isString?: IsStringId
): { type: T; ids: IsStringId extends true ? string[] : number[] };
export function fromGlobalIds<T extends string, IsStringId extends boolean = false>(
  globalIds: Maybe<string>[],
  type: T,
  isString?: IsStringId
): { type: T; ids: IsStringId extends true ? Maybe<string>[] : Maybe<number>[] };
export function fromGlobalIds<T extends string, IsStringId extends boolean = false>(
  globalIds: Maybe<string>[],
  type: T,
  isString?: IsStringId
) {
  return {
    type: type as T,
    ids: globalIds.map((id) => (id ? fromGlobalId(id, type, isString).id : null)),
  };
}
