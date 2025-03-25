import { enumType, inputObjectType } from "nexus";

export const SortByInput = inputObjectType({
  name: "SortByInput",
  definition(t) {
    t.nonNull.string("field");
    t.nonNull.field("direction", {
      type: enumType({ name: "SortByDirection", members: ["ASC", "DESC"] }),
    });
  },
});
