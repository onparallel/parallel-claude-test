import { enumType } from "nexus";

export const Success = enumType({
  name: "Success",
  description: "Represents a successful execution.",
  members: ["SUCCESS"],
});

export const SUCCESS = "SUCCESS" as const;
