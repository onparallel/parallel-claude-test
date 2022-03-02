import { lookup } from "geoip-country";
import { idArg, nonNull, nullable, objectType, queryField } from "nexus";
import { isDefined } from "remeda";
import { getClientIp } from "request-ip";
import { authenticate, chain, ifArgDefined } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { authenticatePublicAccess, fieldBelongsToAccess, taskBelongsToAccess } from "./authorizers";

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

export const metadata = queryField("metadata", {
  type: objectType({
    name: "ConnectionMetadata",
    description: "Information from the connection.",
    definition(t) {
      t.nullable.string("ip");
      t.nullable.string("country");
    },
  }),
  args: {
    keycode: idArg(),
  },
  authorize: ifArgDefined("keycode", authenticatePublicAccess("keycode" as never), authenticate()),
  resolve: async (_, args, ctx) => {
    const ip = getClientIp(ctx.req);
    let country: string | null = null;
    if (isDefined(ip)) {
      const geo = lookup(ip);
      country = geo?.country ?? null;
    }
    return { ip, country };
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
