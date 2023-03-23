import { enumType } from "nexus";

export const Result = enumType({
  name: "Result",
  description: "Represents the result of an operation.",
  members: ["SUCCESS", "FAILURE"],
});

export const RESULT = Object.freeze({
  SUCCESS: "SUCCESS" as const,
  FAILURE: "FAILURE" as const,
});
