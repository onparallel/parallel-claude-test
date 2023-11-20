import { objectType } from "nexus";

export const PetitionVariable = objectType({
  name: "PetitionVariable",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.int("defaultValue", { resolve: (o) => o.default_value });
  },
  sourceType: /* ts */ `{
    name: string;
    default_value: number;
  }`,
});

export const PetitionVariableResult = objectType({
  name: "PetitionVariableResult",
  definition(t) {
    t.nonNull.string("name");
    t.nullable.int("value", { resolve: (o) => o.value });
  },
  sourceType: /* ts */ `{
    name: string;
    value: number | null;
  }`,
});
