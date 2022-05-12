import { lookup } from "geoip-country";
import { idArg, nonNull, nullable, objectType, queryField, stringArg } from "nexus";
import { isDefined } from "remeda";
import { getClientIp } from "request-ip";
import { UAParser } from "ua-parser-js";
import { authenticate, chain, checkClientServerToken, ifArgDefined } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { NexusGenObjects } from "../__types";
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
      t.nullable.string("browserName");
      t.nullable.string("browserVersion");
    },
  }),
  args: {
    keycode: idArg(),
  },
  authorize: ifArgDefined("keycode", authenticatePublicAccess("keycode" as never), authenticate()),
  resolve: async (_, args, ctx) => {
    const data: NexusGenObjects["ConnectionMetadata"] = {};
    const ip = getClientIp(ctx.req);
    if (isDefined(ip)) {
      data.ip = ip;
      const geo = lookup(ip);
      data.country = geo?.country ?? null;
    }
    const userAgent = ctx.req.headers["user-agent"];
    if (isDefined(userAgent)) {
      const ua = new UAParser(userAgent);
      const browser = ua.getBrowser();
      data.browserName = browser.name;
      data.browserVersion = browser.version;
    }
    return data;
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
    const path = await ctx.organizations.loadOrgLogoPath(id);
    return isDefined(path) ? await ctx.images.getImageUrl(path, { resize: { width: 400 } }) : null;
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

export const publicLicenseCode = queryField("publicLicenseCode", {
  type: nullable("PublicLicenseCode"),
  args: {
    code: nonNull(stringArg()),
    token: nonNull(idArg()),
  },
  authorize: checkClientServerToken("token"),
  resolve: async (_, { code }, ctx) => {
    return await ctx.licenseCodes.loadLicenseCode(code);
  },
});
