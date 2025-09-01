import { inject, injectable } from "inversify";
import { format as formatPhoneNumber } from "libphonenumber-js";
import { isNonNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import {
  PetitionFieldType,
  ProfileFieldValue,
  ProfileTypeField,
  ProfileTypeFieldType,
} from "../db/__types";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { ForbiddenError } from "../graphql/helpers/errors";
import { isAtLeast } from "../util/profileTypeFieldPermission";
import {
  ADVERSE_MEDIA_SEARCH_SERVICE,
  AdverseMediaSearchContent,
  IAdverseMediaSearchService,
} from "./AdverseMediaSearchService";
import { BackgroundCheckContent } from "./BackgroundCheckService";

export const PROFILES_HELPER_SERVICE = Symbol.for("PROFILES_HELPER_SERVICE");

@injectable()
export class ProfilesHelperService {
  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ADVERSE_MEDIA_SEARCH_SERVICE) private adverseMedia: IAdverseMediaSearchService,
  ) {}

  async userCanWriteOnProfile(profileId: number, profileTypeFieldId: number, userId: number) {
    const profile = await this.profiles.loadProfile(profileId);
    if (!profile || profile.status !== "OPEN") {
      throw new ForbiddenError("Invalid profile status");
    }

    const effectivePermission = await this.profiles.loadProfileTypeFieldUserEffectivePermission({
      userId,
      profileTypeFieldId,
    });

    if (!isAtLeast(effectivePermission, "WRITE")) {
      throw new ForbiddenError("User does not have WRITE permission on this field");
    }

    const userPermissions = await this.users.loadUserPermissions(userId);
    if (!userPermissions.includes("PROFILES:CREATE_PROFILES")) {
      throw new ForbiddenError("User does not have permission to write profiles");
    }
  }

  mapValueContentFromDatabase(pfv: Pick<ProfileFieldValue, "type" | "content" | "is_draft">) {
    if (pfv.type === "BACKGROUND_CHECK") {
      const content = pfv.content as BackgroundCheckContent;
      return {
        query: content.query,
        search: {
          falsePositivesCount: (content.falsePositives ?? []).length,
          totalCount: content.search.totalCount,
          createdAt: content.search.createdAt,
        },
        entity: isNonNullish(content.entity)
          ? {
              ...pick(content.entity, ["id", "type", "name", "createdAt"]),
              properties: pick(content.entity.properties, ["topics"]),
            }
          : null,
      };
    } else if (pfv.type === "PHONE") {
      return {
        ...pfv.content,
        pretty: formatPhoneNumber(pfv.content.value as string, "INTERNATIONAL"),
      };
    } else if (pfv.type === "ADVERSE_MEDIA_SEARCH") {
      const content = pfv.content as AdverseMediaSearchContent;
      return {
        isDraft: pfv.is_draft,
        search: content.search,
        articles: {
          totalCount: content.articles.totalCount,
          items: content.articles.items.map((article) =>
            this.adverseMedia.addRelevanceToArticle(article, content),
          ),
          createdAt: content.articles.createdAt,
        },
      };
    } else {
      return pfv.content;
    }
  }

  /**
   * Checks if the content for a profile field should be considered a "draft" when copying from a petition field reply.
   *
   * For BACKGROUND_CHECK fields:
   * - If there is a matched entity (a "hit"), it's not a draft.
   * - If the search found no results, its a draft as user needs to explicitly save the search criteria.
   * - If all search results are marked as false positives, it's not a draft (completed).
   * - If there is at least one search result not marked as a false positive, it's still a draft.
   *
   * For all other field types, this always returns false (never a draft).
   *
   * @param type The type of the profile field (e.g., "BACKGROUND_CHECK").
   * @param content The value/content of the field. Its content is expected to be valid for the given type.
   * @returns {boolean} True if the content is still a draft, false otherwise.
   */
  public isDraftContent(type: ProfileTypeFieldType | PetitionFieldType, content: any): boolean {
    if (type === "BACKGROUND_CHECK") {
      const _content = content as BackgroundCheckContent;
      if (isNonNullish(_content.entity)) {
        // There is a hit, so it's not a draft
        return false;
      }

      if (_content.search.totalCount === 0) {
        // Search gives no results, so it's a draft as user needs to explicitly save the search criteria
        return true;
      }

      const falsePositiveIds = (_content.falsePositives ?? []).map(({ id }) => id);
      // If every search result is a false positive, it's not a draft (completed)
      // If at least one result is not a false positive, it's still a draft
      return !_content.search.items.every((item) => falsePositiveIds.includes(item.id));
    }

    // Every other field type will never be a draft
    return false;
  }

  public async getProfileFieldValueUniqueConflicts(
    possibleConflictingFields: { content: any; profileTypeFieldId: number }[],
    profileTypeFieldsById: Record<number, ProfileTypeField>,
    profileTypeId: number,
    orgId: number,
  ) {
    if (possibleConflictingFields.length === 0) {
      return [];
    }

    const profiles = await this.profiles.getPaginatedProfileForOrg(
      orgId,
      {
        offset: 0,
        // at most, we will have as much conflicting profiles as there are conflicting fields
        // so we can limit the query to that number of profiles
        limit: possibleConflictingFields.length,
        filter: {
          profileTypeId: [profileTypeId],
          values: {
            logicalOperator: "OR",
            conditions: possibleConflictingFields.map((f) => ({
              profileTypeFieldId: f.profileTypeFieldId,
              operator: "EQUAL" as const,
              value: f.content.value,
            })),
          },
        },
      },
      profileTypeFieldsById,
    ).items;

    if (profiles.length === 0) {
      return [];
    }

    const profileFieldValues = (
      await this.profiles.loadProfileFieldValueWithDraft(
        profiles.flatMap((p) =>
          possibleConflictingFields.map((f) => ({
            profileId: p.id,
            profileTypeFieldId: f.profileTypeFieldId,
          })),
        ),
      )
    ).filter(isNonNullish);

    if (profileFieldValues.length === 0) {
      return [];
    }

    return profileFieldValues
      .filter(
        ({ value }) =>
          isNonNullish(value) &&
          possibleConflictingFields.some(
            (f) =>
              value.profile_type_field_id === f.profileTypeFieldId &&
              value.content.value === f.content!.value,
          ),
      )
      .map(({ value }) => {
        const profile = profiles.find((p) => p.id === value!.profile_id);
        assert(profile, "Profile not found");
        return {
          profileTypeFieldId: value!.profile_type_field_id,
          profileTypeFieldName: profileTypeFieldsById[value!.profile_type_field_id].name,
          profileId: value!.profile_id,
          profileName: profile.localizable_name,
          profileStatus: profile.status,
          content: value!.content,
        };
      });
  }
}
