import { booleanArg, mutationField, nonNull } from "nexus";
import { PetitionFieldComment } from "../../../db/__types";
import { toPlainText } from "../../../util/slate";
import { and, authenticateAnd, ifArgEquals } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { jsonArg } from "../../helpers/scalars";
import { validPetitionFieldCommentContent } from "../../public/authorizers";
import {
  commentsBelongsToPetition,
  fieldsAreNotInternal,
  fieldsBelongsToPetition,
  fieldsHaveCommentsEnabled,
  petitionIsNotAnonymized,
  userHasAccessToPetitions,
} from "../authorizers";
import { userIsCommentAuthor } from "./authorizers";

export const createPetitionFieldComment = mutationField("createPetitionFieldComment", {
  description: "Create a petition field comment.",
  type: "PetitionFieldComment",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    ifArgEquals(
      "isInternal",
      false,
      and(
        userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
        fieldsHaveCommentsEnabled("petitionFieldId"),
        fieldsAreNotInternal("petitionFieldId")
      )
    ),
    petitionIsNotAnonymized("petitionId"),
    validPetitionFieldCommentContent("content", "petitionFieldId", true)
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    content: nonNull(jsonArg()),
    isInternal: booleanArg(),
    subscribeNoPermissions: booleanArg(),
  },
  resolve: async (_, args, ctx) => {
    // TODO verificar que los mencionados tienen permisos a la peticion
    // - si no tienen permisos el flag subcribeNoPermissions ha de ser true
    // - si no tienen permisos, tira un error con los mencionados sin permisos
    // para mostrar una confirmacion de subscripcion en el front.
    ctx.petitions.loadPetitionFieldCommentsForField.dataloader.clear({
      loadInternalComments: true,
      petitionFieldId: args.petitionFieldId,
      petitionId: args.petitionId,
    });
    return await ctx.petitions.createPetitionFieldCommentFromUser(
      {
        petitionId: args.petitionId,
        petitionFieldId: args.petitionFieldId,
        contentJson: args.content,
        content: toPlainText(args.content),
        isInternal: args.isInternal ?? false,
      },
      ctx.user!
    );
  },
});

export const deletePetitionFieldComment = mutationField("deletePetitionFieldComment", {
  description: "Delete a petition field comment.",
  type: "PetitionField",
  authorize: authenticateAnd(
    async (root, args, ctx, info) => {
      // if the comment is external, user must have OWNER or WRITE permissions on the petition
      const comment = (await ctx.petitions.loadPetitionFieldComment(
        args.petitionFieldCommentId
      )) as PetitionFieldComment;
      return await userHasAccessToPetitions(
        "petitionId",
        comment?.is_internal || comment?.user_id === ctx.user!.id ? undefined : ["OWNER", "WRITE"]
      )(root, args, ctx, info);
    },
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId"),
    userIsCommentAuthor("petitionFieldCommentId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
  },
  resolve: async (_, args, ctx) => {
    await ctx.petitions.deletePetitionFieldCommentFromUser(
      args.petitionId,
      args.petitionFieldId,
      args.petitionFieldCommentId,
      ctx.user!
    );
    return (await ctx.petitions.loadField(args.petitionFieldId))!;
  },
});

export const updatePetitionFieldComment = mutationField("updatePetitionFieldComment", {
  description: "Update a petition field comment.",
  type: "PetitionFieldComment",
  authorize: authenticateAnd(
    async (root, args, ctx, info) => {
      // if the comment is external, user must have OWNER or WRITE permissions on the petition
      const comment = await ctx.petitions.loadPetitionFieldComment(args.petitionFieldCommentId);
      return await userHasAccessToPetitions(
        "petitionId",
        comment?.is_internal || comment?.user_id === ctx.user!.id ? undefined : ["OWNER", "WRITE"]
      )(root, args, ctx, info);
    },
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    userIsCommentAuthor("petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId"),
    validPetitionFieldCommentContent("content", "petitionFieldId", true)
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
    content: nonNull(jsonArg()),
    subscribeNoPermissions: booleanArg(),
  },
  resolve: async (_, args, ctx) => {
    // TODO verificar que los mencionados tienen permisos a la peticion
    // - si no tienen permisos el flag subcribeNoPermissions ha de ser true
    // - si no tienen permisos, tira un error con los mencionados sin permisos
    // para mostrar una confirmacion de subscripcion en el front.
    return await ctx.petitions.updatePetitionFieldCommentFromUser(
      args.petitionFieldCommentId,
      {
        content: toPlainText(args.content),
        contentJson: args.content,
      },
      ctx.user!
    );
  },
});
