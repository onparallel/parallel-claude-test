import { decode, encode } from "./token";
import { Maybe } from "./types";

export function toGlobalId(type: string, id: number) {
  return encode(Buffer.from(`${type}:${id}`, "utf8"));
}

export function fromGlobalId<T extends string = string>(
  globalId: string,
  type?: T
): { id: number; type: T } {
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
  if (!id || !id.match(/^[1-9]\d*$/)) {
    throw new Error(`Invalid id ${globalId}`);
  }
  return {
    type: _type as T,
    id: parseInt(id, 10),
  };
}

export function fromGlobalIds<T extends string>(
  globalIds: string[],
  type: string
): { type: T; ids: number[] };
export function fromGlobalIds<T extends string>(
  globalIds: Maybe<string>[],
  type: string
): { type: T; ids: Maybe<number>[] };
export function fromGlobalIds(globalIds: Maybe<string>[], type: string) {
  return {
    type,
    ids: globalIds.map((id) => (id ? fromGlobalId(id, type).id : null)),
  };
}
