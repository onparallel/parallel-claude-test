import { core, enumType, interfaceType, objectType } from "nexus";
import { isDefined } from "remeda";
import { ProfileEventTypeValues } from "../../db/__types";
import { mapProfileEventPayload } from "../../util/eventMapper";
import { userOrPetitionAccessResolver } from "../helpers/userOrPetitionAccessResolver";

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
    t.jsonObject("data", { resolve: (o) => mapProfileEventPayload(o) });
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
      case "PROFILE_CLOSED":
        return "ProfileClosedEvent";
      case "PROFILE_SCHEDULED_FOR_DELETION":
        return "ProfileScheduledForDeletionEvent";
      case "PROFILE_REOPENED":
        return "ProfileReopenedEvent";
      case "PROFILE_ANONYMIZED":
        return "ProfileAnonymizedEvent";
      case "PROFILE_UPDATED":
        return "ProfileUpdatedEvent";
      case "PROFILE_RELATIONSHIP_CREATED":
        return "ProfileRelationshipCreatedEvent";
      case "PROFILE_RELATIONSHIP_REMOVED":
        return "ProfileRelationshipRemovedEvent";
    }
  },
  sourceType: "profileEvents.ProfileEvent",
});

function createProfileEvent<TypeName extends string>(
  name: TypeName,
  definition: (t: core.ObjectDefinitionBlock<TypeName>) => void,
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
        if (!isDefined(root.data.user_id)) {
          return null;
        }
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  },
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
  },
);
export const ProfileFieldExpiryUpdatedEvent = createProfileEvent(
  "ProfileFieldExpiryUpdatedEvent",
  (t) => {
    t.nullable.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        if (!isDefined(root.data.user_id)) {
          return null;
        }
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  },
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
  t.nullable.field("disassociatedBy", {
    type: "UserOrPetitionAccess",
    resolve: userOrPetitionAccessResolver,
  });
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      if (isDefined(root.data.user_id)) {
        return await ctx.users.loadUser(root.data.user_id);
      }
      return null;
    },
  });
});

export const ProfileClosedEvent = createProfileEvent("ProfileClosedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});

export const ProfileScheduledForDeletionEvent = createProfileEvent(
  "ProfileScheduledForDeletionEvent",
  (t) => {
    t.nullable.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
  },
);

export const ProfileReopenedEvent = createProfileEvent("ProfileReopenedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});

export const ProfileAnonymizedEvent = createProfileEvent("ProfileAnonymizedEvent", () => {});

export const ProfileUpdatedEvent = createProfileEvent("ProfileUpdatedEvent", (t) => {
  t.nullable.field("user", {
    type: "User",
    resolve: async (root, _, ctx) => {
      if (!root.data.user_id) return null;

      return await ctx.users.loadUser(root.data.user_id);
    },
  });
});

export const ProfileRelationshipCreatedEvent = createProfileEvent(
  "ProfileRelationshipCreatedEvent",
  (t) => {
    t.nullable.field("relationship", {
      type: "ProfileRelationship",
      resolve: async (root, _, ctx) => {
        return await ctx.profiles.loadProfileRelationship(root.data.profile_relationship_id);
      },
    });
    t.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.data.user_id))!;
      },
    });
  },
);

export const ProfileRelationshipRemovedEvent = createProfileEvent(
  "ProfileRelationshipRemovedEvent",
  (t) => {
    t.nullable.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        if (!isDefined(root.data.user_id)) {
          return null;
        }
        return await ctx.users.loadUser(root.data.user_id);
      },
    });
    t.nonNull.string("reason", { resolve: (o) => o.data.reason });
  },
);
