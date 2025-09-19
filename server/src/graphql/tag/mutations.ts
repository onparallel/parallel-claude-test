import { booleanArg, inputObjectType, mutationField, nonNull, nullable, stringArg } from "nexus";
import { DatabaseError } from "pg";
import { isNonNullish, unique, zip } from "remeda";
import { CreateTag } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { RESULT } from "../helpers/Result";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyString } from "../helpers/validators/notEmptyString";
import {
  petitionsAreNotPublicTemplates,
  petitionsAreNotScheduledForDeletion,
  userHasAccessToPetitions,
} from "../petition/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import { userHasAccessToTags } from "./authorizers";
import { validateHexColor } from "./validators";

export const createTag = mutationField("createTag", {
  description: "Creates a tag in the user's organization",
  type: "Tag",
  authorize: authenticateAnd(contextUserHasPermission("TAGS:CREATE_TAGS")),
  validateArgs: validateAnd(
    validateHexColor("color"),
    notEmptyString("name"),
    maxLength("name", 100),
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
        ctx.user!,
      );
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.constraint === "tag__organization_id__name__unique"
      ) {
        throw new ApolloError(
          "The organization already has a tag with this name",
          "TAG_ALREADY_EXISTS",
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
  authorize: authenticateAnd(
    userHasAccessToTags("id"),
    contextUserHasPermission("TAGS:UPDATE_TAGS"),
  ),
  validateArgs: validateAnd(
    validateHexColor("data.color"),
    notEmptyString("data.name"),
    maxLength("data.name", 100),
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
      }).asArg(),
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
      if (
        error instanceof DatabaseError &&
        error.constraint === "tag__organization_id__name__unique"
      ) {
        throw new ApolloError(
          "The organization already has a tag with this name",
          "TAG_ALREADY_EXISTS",
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
  authorize: authenticateAnd(
    userHasAccessToTags("id"),
    contextUserHasPermission("TAGS:DELETE_TAGS"),
  ),
  args: {
    id: nonNull(globalIdArg("Tag")),
    force: nullable(
      booleanArg({
        description: "Pass true to force deleting tag with assigned parallels.",
      }),
    ),
  },
  resolve: async (_, { id, force }, ctx) => {
    const taggedPetitions = await ctx.petitions.getTaggedPetitions(id);
    const viewsWithTag = await ctx.views.getPetitionListViewUsingTags(id);

    if ((viewsWithTag.length > 0 || taggedPetitions.length > 0) && !force) {
      const petitionOwners = await ctx.petitions.loadPetitionOwner(
        taggedPetitions.map((p) => p.id),
      );
      const viewsOwners = await ctx.users.loadUser(viewsWithTag.map((v) => v.user_id));
      const usersData = await ctx.users.loadUserData(
        unique([
          ...petitionOwners.map((o) => o!.user_data_id),
          ...viewsOwners.map((vo) => vo!.user_data_id),
        ]),
      );
      const data = usersData.map((ownerData) => {
        return {
          fullName: fullName(ownerData!.first_name, ownerData!.last_name),
          email: ownerData!.email,
          petitionCount: zip(taggedPetitions, petitionOwners).filter(
            ([p, o]) => !p.is_template && o!.user_data_id === ownerData!.id,
          ).length,
          templateCount: zip(taggedPetitions, petitionOwners).filter(
            ([p, o]) => p.is_template && o!.user_data_id === ownerData!.id,
          ).length,
          petitionListViewCount: viewsOwners.filter((vo) => vo!.user_data_id === ownerData!.id)
            .length,
        };
      });

      throw new ApolloError(
        "The tag has assigned parallels or views. Pass force=true to force deletion",
        "TAG_IS_USED",
        { data },
      );
    }

    try {
      const input = viewsWithTag.map((view) => {
        const filtersWithoutTag = (
          view.data.tagsFilters.filters as { value: number[]; operator: string }[]
        )
          .map(({ value, operator }) => {
            if (value.length === 1 && value[0] === id) return null;
            return { value: value.filter((v) => v !== id), operator };
          })
          .filter((f) => f !== null);

        const tagsFilters = filtersWithoutTag.length
          ? {
              operator: view.data.tagsFilters.operator,
              filters: filtersWithoutTag,
            }
          : null;
        return [view.id, { ...view.data, tagsFilters }] as [number, any];
      });

      const tag = (await ctx.tags.loadTag(id))!;

      const untaggedPetitionIds = await ctx.tags.withTransaction(async (t) => {
        await ctx.views.updatePetitionListViewData(input, ctx.user!, t);
        const petitionTags = await ctx.tags.untagPetition(id, undefined, t);
        await ctx.tags.deleteTag(id, ctx.user!, t);

        return unique(petitionTags.map((pt) => pt.petition_id));
      });

      for (const petitionId of untaggedPetitionIds) {
        await ctx.petitions.createEvent({
          type: "PETITION_UNTAGGED",
          petition_id: petitionId,
          data: {
            user_id: ctx.user!.id,
            tag_ids: [id],
            tag_names: [tag.name],
          },
        });
      }

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
    userHasAccessToTags("tagId"),
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
  ),
  resolve: async (_, args, ctx) => {
    const [petitionTag] = await ctx.tags.tagPetition(args.tagId, args.petitionId, ctx.user!);

    if (isNonNullish(petitionTag)) {
      await ctx.petitions.createEvent({
        petition_id: args.petitionId,
        type: "PETITION_TAGGED",
        data: {
          user_id: ctx.user!.id,
          tag_ids: [petitionTag.tag_id],
          tag_names: [petitionTag.tag_name],
        },
      });
      await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);
    }

    return (await ctx.petitions.loadPetition(args.petitionId))!;
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
    userHasAccessToTags("tagId"),
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
  ),
  resolve: async (_, args, ctx) => {
    const [petitionTag] = await ctx.tags.untagPetition(args.tagId, args.petitionId);

    if (isNonNullish(petitionTag)) {
      const tag = (await ctx.tags.loadTag(petitionTag.tag_id))!;
      await ctx.petitions.createEvent({
        petition_id: args.petitionId,
        type: "PETITION_UNTAGGED",
        data: {
          user_id: ctx.user!.id,
          tag_ids: [petitionTag.tag_id],
          tag_names: [tag.name],
        },
      });
      await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);
    }
    return (await ctx.petitions.loadPetition(args.petitionId))!;
  },
});
