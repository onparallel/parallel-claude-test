import {
  arg,
  enumType,
  idArg,
  intArg,
  nonNull,
  queryField,
} from "@nexus/schema";
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
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});

export const globalIdEncode = queryField("globalIdEncode", {
  description: "Encodes the given ID into a Global ID.",
  type: "SupportMethodResponse",
  args: {
    id: nonNull(intArg({ description: "ID to encode" })),
    type: nonNull(
      arg({
        type: enumType({
          name: "EntityType",
          members: ["Petition", "User", "Contact", "Organization"],
        }),
      })
    ),
  },
  authorize: supportMethodAccess(),
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
