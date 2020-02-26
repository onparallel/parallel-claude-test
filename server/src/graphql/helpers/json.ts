import { scalarType } from "nexus";

export const JSONScalar = scalarType({
  name: "JSON",
  asNexusMethod: "json",
  serialize: _ => _,
  parseValue: _ => _
});
