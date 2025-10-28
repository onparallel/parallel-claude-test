import { booleanArg, inputObjectType, mutationField, nonNull, stringArg } from "nexus";
import { assert } from "ts-essentials";
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
  variableIsNotBeingReferencedOnLogicConditions,
} from "./authorizers";

export const FIELD_REFERENCE_REGEX = /^[a-z_][a-z0-9_]*$/i;

export const PetitionVariableValueLabelInput = inputObjectType({
  name: "PetitionVariableValueLabelInput",
  definition(t) {
    t.nonNull.float("value");
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
          t.nonNull.string("name");
          t.nonNull.float("defaultValue");
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
  ),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createVariable(
      args.petitionId,
      {
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
          t.nonNull.float("defaultValue");
          t.boolean("showInReplies");
          t.list.nonNull.field("valueLabels", {
            type: "PetitionVariableValueLabelInput",
          });
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
        show_in_replies: args.data.showInReplies ?? true,
        value_labels: args.data.valueLabels ?? [],
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
    variableIsNotBeingReferencedOnLogicConditions("petitionId", "name"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    name: nonNull(stringArg()),
    dryrun: booleanArg({
      default: false,
      description:
        "If true, this will do a dry-run of the mutation to throw possible errors but it will not perform any modification in DB",
    }),
  },
  resolve: async (_, args, ctx) => {
    if (args.dryrun) {
      const petition = await ctx.petitions.loadPetition(args.petitionId);
      assert(petition, "petition expected to be defined");
      return petition;
    }

    return await ctx.petitions.deleteVariable(args.petitionId, args.name, `User:${ctx.user!.id}`);
  },
});
