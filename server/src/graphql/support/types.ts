import { objectType } from "nexus";

export const SupportMethodResponse = objectType({
  name: "SupportMethodResponse",
  description: "Return type for all support methods",
  definition(t) {
    t.field("result", { type: "Result" });
    t.nullable.string("message");
  },
});
