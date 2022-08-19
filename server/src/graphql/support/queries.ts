import { idArg, nonNull, queryField, stringArg } from "nexus";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { RESULT } from "../helpers/result";
import { supportMethodAccess } from "./authorizers";

export const globalIdDecode = queryField("globalIdDecode", {
  description: "Decodes the given Global ID into an entity in the database.",
  type: "SupportMethodResponse",
  args: {
    id: nonNull(idArg({ description: "Global ID to decode" })),
  },
  authorize: supportMethodAccess(),
  resolve: (_, args) => {
    try {
      const { id, type } = fromGlobalId(args.id);
      return { result: RESULT.SUCCESS, message: `${type}:${id}` };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});

export const globalIdEncode = queryField("globalIdEncode", {
  description: "Encodes the given ID into a Global ID.",
  type: "SupportMethodResponse",
  args: {
    id: nonNull(stringArg({ description: "ID to encode" })),
    type: nonNull(stringArg({ description: "ID type" })),
  },
  authorize: supportMethodAccess(),
  resolve: (_, args) => {
    try {
      return {
        result: RESULT.SUCCESS,
        message: toGlobalId<string | number>(args.type, args.id),
      };
    } catch (e: any) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});
