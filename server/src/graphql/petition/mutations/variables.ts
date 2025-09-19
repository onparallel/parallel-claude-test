import { inputObjectType, mutationField, nonNull, stringArg } from "nexus";
import { authenticateAnd } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { validateAnd } from "../../helpers/validateArgs";
import { maxLength } from "../../helpers/validators/maxLength";
import { validateRegex } from "../../helpers/validators/validateRegex";
import {
  petitionDoesNotHaveStartedProcess,
  petitionIsNotAnonymized,
  petitionsAreEditable,
  petitionsAreNotScheduledForDeletion,
  userHasAccessToPetitions,
} from "../authorizers";
import {
  petitionVariableCanBeCreated,
  variableIsNotBeingReferencedByFieldLogic,
} from "./authorizers";

export const FIELD_REFERENCE_REGEX = /^[a-z_][a-z0-9_]*$/i;

export const createPetitionVariable = mutationField("createPetitionVariable", {
  type: "Petition",
  description: "Creates a new variable on the petition.",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionVariableCanBeCreated("petitionId", "data"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    data: nonNull(
      inputObjectType({
        name: "CreatePetitionVariableInput",
        definition(t) {
          t.nonNull.string("name");
          t.nonNull.float("defaultValue");
        },
      }),
    ),
  },
  validateArgs: validateAnd(
    maxLength("data.name", 30),
    validateRegex("data.name", FIELD_REFERENCE_REGEX),
  ),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createVariable(
      args.petitionId,
      {
        name: args.data.name,
        default_value: args.data.defaultValue,
      },
      `User:${ctx.user!.id}`,
    );
  },
});

export const updatePetitionVariable = mutationField("updatePetitionVariable", {
  type: "Petition",
  description: "Updates a variable on the petition.",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
    petitionIsNotAnonymized("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    name: nonNull(stringArg()),
    data: nonNull(
      inputObjectType({
        name: "UpdatePetitionVariableInput",
        definition(t) {
          t.nonNull.float("defaultValue");
        },
      }),
    ),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updateVariable(
      args.petitionId,
      args.name,
      {
        default_value: args.data.defaultValue,
      },
      `User:${ctx.user!.id}`,
    );
  },
});

export const deletePetitionVariable = mutationField("deletePetitionVariable", {
  type: "Petition",
  description: "Deletes a variable from the petition.",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    variableIsNotBeingReferencedByFieldLogic("petitionId", "name"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    name: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.deleteVariable(args.petitionId, args.name, `User:${ctx.user!.id}`);
  },
});
