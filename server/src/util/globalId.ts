import { decode, encode } from "./token";

export function toGlobalId(type: string, id: number) {
  return encode(Buffer.from(`${type}:${id}`, "utf8"));
}

export function fromGlobalId(globalId: string, verifytype?: string) {
  const [type, id] = decode(globalId).toString("utf8").split(":");
  if (verifytype && verifytype !== type) {
    throw new Error("Invalid id");
  }
  if (!id || !id.match(/^[1-9]\d*$/)) {
    throw new Error("Invalid id");
  }
  return {
    type,
    id: parseInt(id, 10),
  };
}

export function fromGlobalIds(globalIds: string[], verifytype: string) {
  return {
    type: verifytype,
    ids: globalIds.map((globalId) => fromGlobalId(globalId, verifytype).id),
  };
}
