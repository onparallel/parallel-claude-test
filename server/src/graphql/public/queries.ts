import { idArg, list, nonNull, nullable, queryField, stringArg } from "nexus";
import { chain } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { authenticatePublicAccess, fieldBelongsToAccess } from "./authorizers";

export const accessQuery = queryField("access", {
  type: nullable("PublicPetitionAccess"),
  args: {
    keycode: nonNull(idArg()),
  },
  authorize: authenticatePublicAccess("keycode"),
  resolve: async (root, args, ctx) => {
    return ctx.access!;
  },
});

export const commentsQuery = queryField("petitionFieldComments", {
  type: list(nonNull("PublicPetitionFieldComment")),
  authorize: chain(authenticatePublicAccess("keycode"), fieldBelongsToAccess("petitionFieldId")),
  args: {
    keycode: nonNull(idArg()),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
  },
  description: "The comments for this field.",
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.loadPetitionFieldCommentsForField({
      petitionId: ctx.access!.petition_id,
      petitionFieldId: args.petitionFieldId,
    });
  },
});

export const publicOrgLogo = queryField("publicOrgLogoUrl", {
  type: nullable("String"),
  args: {
    id: nonNull(globalIdArg("Organization")),
  },
  resolve: async (_, { id }, ctx) => {
    return await ctx.organizations.getOrgLogoUrl(id);
  },
});

export const publicPetitionLinkBySlug = queryField("publicPetitionLinkBySlug", {
  type: nullable("PublicPetitionLink"),
  args: {
    slug: nonNull(stringArg()),
  },
  resolve: async (_, { slug }, ctx) => {
    const publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    return publicLink?.is_active ? publicLink : null;
  },
});
