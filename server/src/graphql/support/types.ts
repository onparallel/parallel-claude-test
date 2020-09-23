import { objectType } from "@nexus/schema";

export const SupportMethodResponse = objectType({
  name: "SupportMethodResponse",
  description: "Return type for all support methods",
  definition(t) {
    t.field("result", { type: "Result" });
    t.string("message", { nullable: true });
  },
});
