import { idArg, nonNull, nullable, queryField } from "nexus";
import { chain } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { authenticatePublicAccess, fieldBelongsToAccess, taskBelongsToAccess } from "./authorizers";
import { lookup } from "geoip-country";
import { getClientIp } from "request-ip";

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

export const publicPetitionFieldQuery = queryField("publicPetitionField", {
  type: nonNull("PublicPetitionField"),
  authorize: chain(authenticatePublicAccess("keycode"), fieldBelongsToAccess("petitionFieldId")),
  args: {
    keycode: nonNull(idArg()),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
  },
  description: "The comments for this field.",
  resolve: async (_, args, ctx) => {
    return (await ctx.petitions.loadField(args.petitionFieldId))!;
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

export const publicGetCountry = queryField("publicGetCountry", {
  type: nullable("String"),
  resolve: async (_, args, ctx) => {
    const ip = getClientIp(ctx.req);
    const geo = lookup(ip ?? "");
    return geo?.country ?? null;
  },
});

export const publicPetitionLinkBySlug = queryField("publicPetitionLinkBySlug", {
  type: nullable("PublicPublicPetitionLink"),
  args: {
    slug: nonNull(idArg()),
  },
  resolve: async (_, { slug }, ctx) => {
    const publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    const petition = publicLink
      ? await ctx.petitions.loadPetition(publicLink.template_id)
      : undefined;

    return publicLink?.is_active && petition ? publicLink : null;
  },
});

export const publicTask = queryField("publicTask", {
  type: "Task",
  args: {
    keycode: nonNull(idArg()),
    taskId: nonNull(globalIdArg("Task")),
  },
  authorize: chain(authenticatePublicAccess("keycode"), taskBelongsToAccess("taskId")),
  resolve: async (_, { taskId }, ctx) => {
    return (await ctx.tasks.loadTask(taskId))!;
  },
});
