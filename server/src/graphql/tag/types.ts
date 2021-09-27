import { objectType } from "nexus";

export const Tag = objectType({
  name: "Tag",
  definition(t) {
    t.globalId("id", { prefixName: "Tag" });
    t.nonNull.string("name");
    t.nonNull.string("color", {
      description: "The color of the tag in hex format (example: #FFFFFF)",
    });
    t.nonNull.datetime("createdAt", {
      description: "Time when the resource was created.",
      resolve: (o) => o.created_at,
    });
  },
});
