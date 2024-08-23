import { lookup } from "geoip-country";
import { arg, idArg, list, nonNull, nullable, objectType, queryField, stringArg } from "nexus";
import { isNonNullish } from "remeda";
import { getClientIp } from "request-ip";
import { UAParser } from "ua-parser-js";
import { NexusGenObjects } from "../__types";
import { authenticate, chain, checkClientServerToken, ifArgDefined } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import {
  authenticatePublicAccess,
  fieldBelongsToAccess,
  taskBelongsToAccess,
  validPublicPetitionLinkPrefill,
} from "./authorizers";

export const remindersOptOut = queryField("remindersOptOut", {
  description:
    "Exposes minimal information for reminders page so the contact doesn't need to be verified",
  type: nullable(
    objectType({
      name: "PublicRemindersOptOut",
      definition(t) {
        t.nullable.string("orgLogoUrl");
        t.string("orgName");
      },
    }),
  ),
  args: {
    keycode: nonNull(idArg()),
  },
  resolve: async (_, { keycode }, ctx) => {
    const access = await ctx.petitions.loadAccessByKeycode(keycode);
    if (!access || access.status === "INACTIVE") return null;

    const granter = await ctx.users.loadUser(access.granter_id);
    if (!granter) return null;

    const organization = await ctx.organizations.loadOrg(granter.org_id);
    if (!organization) return null;

    const logoPath = await ctx.organizations.loadOrgLogoPath(organization.id);

    return {
      orgLogoUrl: isNonNullish(logoPath) ? await ctx.images.getImageUrl(logoPath) : null,
      orgName: organization.name,
    };
  },
});

export const accessQuery = queryField("access", {
  type: "PublicPetitionAccess",
  args: {
    keycode: nonNull(idArg()),
  },
  authorize: authenticatePublicAccess("keycode"),
  resolve: async (root, args, ctx) => {
    return ctx.access!;
  },
});

export const accessesQuery = queryField((t) => {
  t.paginationField("accesses", {
    type: "PublicPetitionAccess",
    extendArgs: {
      keycode: nonNull(idArg()),
      status: list(nonNull(arg({ type: "PetitionStatus" }))),
    },
    searchable: true,
    authorize: authenticatePublicAccess("keycode" as never),
    resolve: async (root, { offset, limit, status, search }, ctx) => {
      return await ctx.contacts.getPaginatedAccessesForContact(ctx.access!.contact_id!, {
        search,
        offset,
        limit,
        status,
      });
    },
  });
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
      t.nullable.string("deviceType");
    },
  }),
  args: {
    keycode: idArg(),
  },
  authorize: ifArgDefined("keycode", authenticatePublicAccess("keycode" as never), authenticate()),
  resolve: async (_, args, ctx) => {
    const data: NexusGenObjects["ConnectionMetadata"] = {};
    const ip = getClientIp(ctx.req);
    if (isNonNullish(ip)) {
      data.ip = ip;
      const geo = lookup(ip);
      data.country = geo?.country ?? null;
    }
    const userAgent = ctx.req.headers["user-agent"];
    if (isNonNullish(userAgent)) {
      const ua = new UAParser(userAgent);
      const browser = ua.getBrowser();
      data.browserName = browser.name;
      data.browserVersion = browser.version;
      data.deviceType = ua.getDevice().type;
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

export const publicOrg = queryField("publicOrg", {
  type: nullable("PublicOrganization"),
  args: {
    id: nonNull(globalIdArg("Organization")),
  },
  resolve: async (_, { id }, ctx) => {
    return await ctx.organizations.loadOrg(id);
  },
});

export const publicPetitionLinkBySlug = queryField("publicPetitionLinkBySlug", {
  type: nullable("PublicPublicPetitionLink"),
  args: {
    slug: nonNull(idArg()),
    prefill: nullable(stringArg()),
  },
  authorize: ifArgDefined("prefill", validPublicPetitionLinkPrefill("prefill" as never, "slug")),
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
