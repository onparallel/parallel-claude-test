import { enumType, objectType } from "nexus";
import { AiCompletionLogStatusValues } from "../../../db/__types";

export const AiCompletionLogStatus = enumType({
  name: "AiCompletionLogStatus",
  members: AiCompletionLogStatusValues,
});

export const AiCompletionLog = objectType({
  name: "AiCompletionLog",
  sourceType: "db.AiCompletionLog",
  definition(t) {
    t.globalId("id");
    t.field("status", {
      type: "AiCompletionLogStatus",
    });
    t.nullable.string("completion");
    t.implements("Timestamps");
  },
});
