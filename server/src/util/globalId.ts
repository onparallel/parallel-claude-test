export function toGlobalId(type: string, id: number) {
  return Buffer.from(`${type}:${id}`, "utf8").toString("base64");
}

export function fromGlobalId(globalId: string, verifytype?: string) {
  const [type, id] = Buffer.from(globalId, "base64")
    .toString("utf8")
    .split(":");
  if (verifytype && verifytype !== type) {
    throw new Error("Invalid id");
  }
  if (!id || !id.match(/^[1-9]\d*$/)) {
    throw new Error("Invalid id");
  }
  return {
    type,
    id: parseInt(id, 10)
  };
}
