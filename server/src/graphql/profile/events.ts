import { core, enumType, interfaceType, objectType } from "nexus";
import { ProfileEventTypeValues } from "../../db/__types";

export const ProfileEvent = interfaceType({
  name: "ProfileEvent",
  definition(t) {
    t.globalId("id");
    t.field("type", {
      type: enumType({
        name: "ProfileEventType",
        members: ProfileEventTypeValues,
      }),
    });
    t.nullable.field("profile", {
      type: "Profile",
      resolve: async (o, _, ctx) => await ctx.profiles.loadProfile(o.profile_id),
    });
    t.datetime("createdAt", {
      resolve: (o) => o.created_at,
    });
  },
  resolveType: (p) => {
    switch (p.type) {
      case "PROFILE_CREATED":
        return "ProfileCreatedEvent";
      case "PROFILE_FIELD_VALUE_UPDATED":
        return "ProfileFieldValueUpdatedEvent";
      case "PROFILE_FIELD_FILE_ADDED":
        return "ProfileFieldFileAddedEvent";
      case "PROFILE_FIELD_FILE_REMOVED":
        return "ProfileFieldFileRemovedEvent";
      case "PROFILE_FIELD_EXPIRY_UPDATED":
        return "ProfileFieldExpiryUpdatedEvent";
      case "PETITION_ASSOCIATED":
        return "PetitionAssociatedEvent";
      case "PETITION_DISASSOCIATED":
        return "PetitionDisassociatedEvent";
    }
  },
  sourceType: "profileEvents.ProfileEvent",
});

function createProfileEvent<TypeName extends string>(
  name: TypeName,
  definition: (t: core.ObjectDefinitionBlock<TypeName>) => void
) {
  return objectType({
    name,
    definition(t) {
      t.implements("ProfileEvent");
      definition(t);
    },
    sourceType: `profileEvents.${name}`,
  });
}

export const ProfileCreatedEvent = createProfileEvent("ProfileCreatedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});
export const ProfileFieldValueUpdatedEvent = createProfileEvent(
  "ProfileFieldValueUpdatedEvent",
  (t) => {
    t.nullable.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  }
);
export const ProfileFieldFileAddedEvent = createProfileEvent("ProfileFieldFileAddedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});
export const ProfileFieldFileRemovedEvent = createProfileEvent(
  "ProfileFieldFileRemovedEvent",
  (t) => {
    t.nullable.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  }
);
export const ProfileFieldExpiryUpdatedEvent = createProfileEvent(
  "ProfileFieldExpiryUpdatedEvent",
  (t) => {
    t.nullable.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  }
);
export const PetitionAssociatedEvent = createProfileEvent("PetitionAssociatedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});

export const PetitionDisassociatedEvent = createProfileEvent("PetitionDisassociatedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});
