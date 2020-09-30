import { decode, encode } from "./token";
import { Maybe } from "./types";

export function toGlobalId(type: string, id: number) {
  return encode(Buffer.from(`${type}:${id}`, "utf8"));
}

export function fromGlobalId<T extends string>(globalId: string, type?: T) {
  const [_type, id] = decode(globalId).toString("utf8").split(":");
  if (type && _type !== type) {
    throw new Error(`${globalId} is not a ${type}`);
  }
  if (!id || !id.match(/^[1-9]\d*$/)) {
    throw new Error(`Invalid id ${globalId}`);
  }
  return {
    type: _type,
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
