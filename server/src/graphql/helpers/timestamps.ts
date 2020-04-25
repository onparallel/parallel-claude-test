import { interfaceType } from "@nexus/schema";

export const Timestamps = interfaceType({
  name: "Timestamps",
  definition: (t) => {
    t.datetime("createdAt", {
      description: "Time when the resource was created.",
      resolve: (o) => o.created_at,
    });
    t.datetime("updatedAt", {
      description: "Time when the resource was last updated.",
      resolve: (o) => o.updated_at,
    });
    t.resolveType(() => null);
  },
});
