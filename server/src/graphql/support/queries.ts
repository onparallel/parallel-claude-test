import { arg, enumType, idArg, intArg, queryField } from "@nexus/schema";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { authenticate, chain } from "../helpers/authorize";
import { RESULT } from "../helpers/result";
import { userBelongsToOrg } from "./authorizers";

export const globalIdDecode = queryField("globalIdDecode", {
  description: "Decodes the given Global ID into an entity in the database.",
  type: "SupportMethodResponse",
  args: {
    id: idArg({ required: true, description: "Global ID to decode" }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: (_, args) => {
    try {
      const { id, type } = fromGlobalId(args.id);
      return { result: RESULT.SUCCESS, message: `${type}:${id}` };
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});

export const globalIdEncode = queryField("globalIdEncode", {
  description: "Encodes the given ID into a Global ID.",
  type: "SupportMethodResponse",
  args: {
    id: intArg({ required: true, description: "ID to encode" }),
    type: arg({
      type: enumType({
        name: "EntityList",
        members: ["Petition", "User", "Contact", "Organization"],
      }),
      required: true,
    }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: (_, args) => {
    try {
      return {
        result: RESULT.SUCCESS,
        message: toGlobalId(args.type, args.id),
      };
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});
