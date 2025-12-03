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
  validateCreatePetitionVariableInput,
  validateUpdatePetitionVariableInput,
} from "../validations";
import {
  petitionVariableCanBeCreated,
  variableIsNotReferencedInFieldOptions,
  variableIsNotReferencedInLogicConditions,
} from "./authorizers";

export const FIELD_REFERENCE_REGEX = /^[a-z_][a-z0-9_]*$/i;

export const PetitionVariableValueLabelInput = inputObjectType({
  name: "PetitionVariableValueLabelInput",
  definition(t) {
    t.nonNull.json("value");
    t.nonNull.string("label");
  },
});

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
          t.nonNull.field("type", {
            type: "PetitionVariableType",
          });
          t.nonNull.string("name");
          t.nonNull.json("defaultValue");
          t.boolean("showInReplies");
          t.list.nonNull.field("valueLabels", {
            type: "PetitionVariableValueLabelInput",
          });
        },
      }),
    ),
  },
  validateArgs: validateAnd(
    maxLength("data.name", 30),
    validateRegex("data.name", FIELD_REFERENCE_REGEX),
    validateCreatePetitionVariableInput("data"),
  ),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createVariable(
      args.petitionId,
      {
        type: args.data.type,
        name: args.data.name,
        default_value: args.data.defaultValue,
        show_in_replies: args.data.showInReplies ?? true,
        value_labels: args.data.valueLabels ?? [],
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
          t.json("defaultValue");
          t.boolean("showInReplies");
          t.list.nonNull.field("valueLabels", {
            type: "PetitionVariableValueLabelInput",
          });
        },
      }),
    ),
  },
  validateArgs: validateUpdatePetitionVariableInput("petitionId", "name", "data"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updateVariable(
      args.petitionId,
      args.name,
      {
        default_value: args.data.defaultValue,
        show_in_replies: args.data.showInReplies ?? true,
        value_labels: args.data.valueLabels,
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
    variableIsNotReferencedInLogicConditions("petitionId", "name"),
    variableIsNotReferencedInFieldOptions("petitionId", "name"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    name: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.deleteVariable(args.petitionId, args.name, `User:${ctx.user!.id}`);
  },
});
