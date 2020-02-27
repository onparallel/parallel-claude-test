import {
  enumType,
  objectType,
  mutationField,
  stringArg,
  arg,
  FieldAuthorizeResolver,
  idArg
} from "nexus";
import { toGlobalId, fromGlobalId } from "../../util/globalId";
import { authenticate, authorizeAnd } from "../helpers/authorize";

export const PetitionLocale = enumType({
  name: "PetitionLocale",
  description: "The locale used for rendering the petition to the contact.",
  members: ["en", "es"]
});

export const PetitionStatus = enumType({
  name: "PetitionStatus",
  description: "The status of a petition.",
  members: [
    { name: "DRAFT", description: "The petition has not been sent." },
    {
      name: "SCHEDULED",
      description: "The petition sendout has been scheduled."
    },
    {
      name: "PENDING",
      description:
        "The petition has been sent and is awaiting for the contact to complete."
    },
    { name: "COMPLETED", description: "The petition is completed" }
  ]
});

export const PetitionProgress = objectType({
  name: "PetitionProgress",
  description: "The progress of a petition.",
  definition(t) {
    t.int("validated", {
      description: "Number of fields validated"
    });
    t.int("replied", {
      description: "Number of fields with a reply and not validated"
    });
    t.int("optional", {
      description: "Number of optional fields not replied or validated"
    });
    t.int("total", {
      description: "Total number of fields in the petition"
    });
  }
});

export const Petition = objectType({
  name: "Petition",
  description: "An petition in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the petition.",
      resolve: o => toGlobalId("Petition", o.id)
    });
    t.string("name", {
      description: "The name of the petition."
    });
    t.string("customRef", {
      description: "The custom ref of the petition.",
      nullable: true,
      resolve: o => o.custom_ref
    });
    t.datetime("deadline", {
      description: "The deadline of the petition.",
      nullable: true,
      resolve: o => o.deadline
    });
    t.field("locale", {
      type: PetitionLocale,
      description: "The locale of the petition."
    });
    t.field("status", {
      type: "PetitionStatus",
      description: "The status of the petition.",
      resolve: o => o.status!
    });
    t.list.field("fields", {
      type: "PetitionField",
      description: "The field definition of the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldsForPetition(root.id);
      }
    });
    t.int("fieldCount", {
      description: "The number of fields in the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldCountForPetition(root.id);
      }
    });
    t.field("progress", {
      type: "PetitionProgress",
      description: "The progress of the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadStatusForPetition(root.id);
      }
    });
    t.list.field("accessess", {
      type: "PetitionAccess",
      description: "The accesses for this petition",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.loadAccessesForPetition(root.id);
      }
    });
  }
});

export const PetitionFieldType = enumType({
  name: "PetitionFieldType",
  description: "Type of a petition field",
  members: [{ name: "FILE_UPLOAD", description: "A file upload field." }]
});

export const PetitionField = objectType({
  name: "PetitionField",
  description: "A field within a petition.",
  definition(t) {
    t.id("id", {
      description: "The ID of the petition field.",
      resolve: o => toGlobalId("PetitionField", o.id)
    });
    t.field("type", {
      type: "PetitionFieldType",
      description: "The type of the petition field."
    });
    t.string("title", {
      nullable: true,
      description: "The title of the petition field."
    });
    t.string("description", {
      nullable: true,
      description: "The description of the petition field."
    });
    t.json("options", {
      description: "The options of the petition.",
      nullable: true
    });
    t.boolean("optional", {
      description: "Determines if this field is optional."
    });
    t.boolean("validated", {
      description: "Determines if the content of this field has been validated."
    });
  }
});

export const PetitionAccess = objectType({
  name: "PetitionAccess",
  description: "An access to a petition",
  definition(t) {
    t.id("id", {
      description: "The ID of the petition field access.",
      resolve: o => toGlobalId("PetitionAccess", o.id)
    });
    t.field("contact", {
      type: "Contact",
      description: "The receiver of the petition through this access.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.contacts.loadOneById(root.contact_id);
      }
    });
  }
});

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "Petition",
  authorize: authenticate(),
  args: {
    name: stringArg({ required: true }),
    locale: arg({ type: PetitionLocale, required: true })
  },
  resolve: async (_, { name, locale }, ctx) => {
    return await ctx.petitions.createPetition({ name, locale }, ctx.user);
  }
});

export const deletePetitions = mutationField("deletePetitions", {
  description: "Delete petitions.",
  type: "Result",
  authorize: authorizeAnd(authenticate(), userHasAccessToPetitions("ids")),
  args: {
    ids: idArg({ required: true, list: true })
  },
  resolve: async (_, args, ctx) => {
    const ids = args.ids.map((arg: string) => {
      const { id } = fromGlobalId(arg, "Petition");
      return id;
    });
    await ctx.petitions.deletePetitionById(ids, ctx.user);
    return "SUCCESS" as const;
  }
});

export function userHasAccessToPetition<
  TypeName extends string,
  FieldName extends string,
  T extends string
>(argName: T): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id } = fromGlobalId(args[argName], "Petition");
      return ctx.petitions.userHasAccessToPetitions(ctx.user.id, [id]);
    } catch {}
    return false;
  };
}

export function userHasAccessToPetitions<
  TypeName extends string,
  FieldName extends string,
  T extends string
>(argName: T): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const ids = args[argName].map((arg: string) => {
        const { id } = fromGlobalId(arg, "Petition");
        return id;
      });
      return ctx.petitions.userHasAccessToPetitions(ctx.user.id, ids);
    } catch {}
    return false;
  };
}
