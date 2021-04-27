import {
  inputObjectType,
  mutationField,
  nonNull,
  stringArg,
} from "@nexus/schema";
import { CreateTag } from "../../db/__types";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyString } from "../helpers/validators/notEmptyString";
import { userHasAccessToPetitions } from "../petition/authorizers";
import { userHasAccessToTags } from "./authorizers";
import { validateHexColor } from "./validators";

export const createTag = mutationField("createTag", {
  description: "Creates a tag linked to the user's organization",
  type: "Tag",
  authorize: authenticate(),
  validateArgs: validateAnd(
    validateHexColor((args) => args.color, "color"),
    notEmptyString((args) => args.name, "name"),
    maxLength((args) => args.name, "name", 100)
  ),
  args: {
    name: nonNull(stringArg()),
    color: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.tags.createTag(
        {
          name: args.name.trim(),
          color: args.color,
        },
        ctx.user!
      );
    } catch (error) {
      if (error.constraint === "tag__organization_id__name__unique") {
        throw new WhitelistedError(
          "The organization already has a tag with this name",
          "TAG_ALREADY_EXISTS"
        );
      } else {
        throw error;
      }
    }
  },
});

export const updateTag = mutationField("updateTag", {
  description: "Updates the name and color of a given tag",
  type: "Tag",
  authorize: authenticateAnd(userHasAccessToTags((args) => args.id)),
  validateArgs: validateAnd(
    validateHexColor((args) => args.data.color, "data.color"),
    notEmptyString((args) => args.data.name, "data.name"),
    maxLength((args) => args.data.name, "data.name", 100)
  ),
  args: {
    id: nonNull(globalIdArg("Tag")),
    data: nonNull(
      inputObjectType({
        name: "UpdateTagInput",
        definition(t) {
          t.string("name");
          t.string("color");
        },
      }).asArg()
    ),
  },
  resolve: async (_, args, ctx) => {
    const data: Partial<CreateTag> = {};
    if (args.data.color) {
      data.color = args.data.color;
    }

    if (args.data.name?.trim()) {
      data.name = args.data.name.trim();
    }
    try {
      return await ctx.tags.updateTag(args.id, data, ctx.user!);
    } catch (error) {
      if (error.constraint === "tag__organization_id__name__unique") {
        throw new WhitelistedError(
          "The organization already has a tag with this name",
          "TAG_ALREADY_EXISTS"
        );
      } else {
        throw error;
      }
    }
  },
});

export const deleteTag = mutationField("deleteTag", {
  description: "Removes the tag from every petition and soft-deletes it",
  type: "Result",
  authorize: authenticateAnd(userHasAccessToTags((args) => args.id)),
  args: {
    id: nonNull(globalIdArg("Tag")),
  },
  resolve: async (_, { id }, ctx) => {
    try {
      await ctx.tags.withTransaction(async (t) => {
        await ctx.tags.untagPetition(id, undefined, t);
        await ctx.tags.deleteTag(id, ctx.user!, t);
      });
      return RESULT.SUCCESS;
    } catch {
      return RESULT.FAILURE;
    }
  },
});

export const tagPetition = mutationField("tagPetition", {
  description: "Tags a petition",
  type: "PetitionBase",
  args: {
    tagId: nonNull(globalIdArg("Tag")),
    petitionId: nonNull(globalIdArg("Petition")),
  },
  authorize: authenticateAnd(
    userHasAccessToTags((args) => args.tagId),
    userHasAccessToPetitions("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    try {
      await ctx.tags.tagPetition(args.tagId, args.petitionId, ctx.user!);
      return (await ctx.petitions.loadPetition(args.petitionId))!;
    } catch (error) {
      if (error.constraint === "petition_tag__petition_id__tag_id__unique") {
        throw new WhitelistedError(
          `Petition ${args.petitionId} is already tagged with tag ${args.tagId}`,
          "PETITION_ALREADY_TAGGED"
        );
      } else {
        throw error;
      }
    }
  },
});

export const untagPetition = mutationField("untagPetition", {
  description: "Removes the given tag from the given petition",
  type: "PetitionBase",
  args: {
    tagId: nonNull(globalIdArg("Tag")),
    petitionId: nonNull(globalIdArg("Petition")),
  },
  authorize: authenticateAnd(
    userHasAccessToTags((args) => args.tagId),
    userHasAccessToPetitions("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    await ctx.tags.untagPetition(args.tagId, args.petitionId);
    return (await ctx.petitions.loadPetition(args.petitionId))!;
  },
});
