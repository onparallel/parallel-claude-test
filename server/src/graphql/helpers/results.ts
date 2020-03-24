import { enumType } from "nexus";

export const Result = enumType({
  name: "Result",
  description: "Represents the result of an operation.",
  members: ["SUCCESS", "FAILURE"],
});
