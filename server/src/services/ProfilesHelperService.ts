import { inject, injectable } from "inversify";
import { format as formatPhoneNumber } from "libphonenumber-js";
import { isNonNullish, pick } from "remeda";
import { ProfileFieldValue } from "../db/__types";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { ForbiddenError } from "../graphql/helpers/errors";
import { isAtLeast } from "../util/profileTypeFieldPermission";
import {
  ADVERSE_MEDIA_SEARCH_SERVICE,
  AdverseMediaSearchContent,
  IAdverseMediaSearchService,
} from "./AdverseMediaSearchService";

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
      return {
        query: isNonNullish(pfv.content.query)
          ? pick(pfv.content.query, ["name", "date", "type", "country"])
          : null,
        search: isNonNullish(pfv.content.search)
          ? pick(pfv.content.search, ["totalCount", "createdAt"])
          : null,
        entity: isNonNullish(pfv.content.entity)
          ? {
              ...pick(pfv.content.entity, ["id", "type", "name", "createdAt"]),
              properties: pick(pfv.content.entity.properties, ["topics"]),
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
}
