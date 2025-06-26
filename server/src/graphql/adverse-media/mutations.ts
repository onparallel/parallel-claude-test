import { mutationField, nonNull, nullable, stringArg } from "nexus";
import { uniqueBy } from "remeda";
import { authenticateAnd } from "../helpers/authorize";
import { ForbiddenError } from "../helpers/errors";
import { authenticatePetitionOrProfileReplyToken } from "../integrations/authorizers";
import {
  NumericParams,
  parseReplyToken,
  PetitionReplyParams,
  ProfileReplyParams,
} from "../integrations/utils";
import { userHasFeatureFlag } from "../petition/authorizers";

export const classifyAdverseMediaArticle = mutationField("classifyAdverseMediaArticle", {
  type: nonNull("AdverseMediaArticle"),
  args: {
    id: nonNull(stringArg()),
    classification: nullable("AdverseMediaArticleRelevance"),
    token: nonNull(stringArg()),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("ADVERSE_MEDIA_SEARCH"),
    authenticatePetitionOrProfileReplyToken("token", "ADVERSE_MEDIA_SEARCH"),
  ),
  resolve: async (_, args, ctx) => {
    const addedAt = new Date();
    function buildClassification<
      T extends { id: string; added_at: Date; added_by_user_id: number },
    >(content: { relevant_articles?: T[]; irrelevant_articles?: T[]; dismissed_articles?: T[] }) {
      const relevant = content?.relevant_articles ?? [];
      const irrelevant = content?.irrelevant_articles ?? [];
      const dismissed = content?.dismissed_articles ?? [];

      return {
        // if args.classification === "RELEVANT", add the article to the relevant_articles array, ensuring it is not repeated
        // if args.classification !== "RELEVANT", remove the article from the relevant_articles array
        relevant_articles:
          args.classification === "RELEVANT"
            ? uniqueBy(
                [
                  ...relevant,
                  {
                    id: args.id,
                    added_at: addedAt,
                    added_by_user_id: ctx.user!.id,
                  } as T,
                ],
                (a) => a.id,
              )
            : relevant.filter((r) => r.id !== args.id),
        // same rules for irrelevant and dismissed articles
        irrelevant_articles:
          args.classification === "IRRELEVANT"
            ? uniqueBy(
                [
                  ...irrelevant,
                  { id: args.id, added_at: addedAt, added_by_user_id: ctx.user!.id } as T,
                ],
                (a) => a.id,
              )
            : irrelevant.filter((r) => r.id !== args.id),
        dismissed_articles:
          args.classification === "DISMISSED"
            ? uniqueBy(
                [
                  ...dismissed,
                  { id: args.id, added_at: addedAt, added_by_user_id: ctx.user!.id } as T,
                ],
                (a) => a.id,
              )
            : dismissed.filter((r) => r.id !== args.id),
      };
    }

    async function petitionParamsResolver(params: NumericParams<PetitionReplyParams>) {
      // ADVERSE_MEDIA_SEARCH field is a "single reply" field
      // when running this mutation it is always expected to have exactly 1 reply stored in DB
      const fieldReplies = await ctx.petitions.loadRepliesForField(params.fieldId);
      const replies = fieldReplies.filter(
        (r) =>
          r.type === "ADVERSE_MEDIA_SEARCH" &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      );
      if (replies.length !== 1) {
        throw new ForbiddenError(
          `Expected exactly one reply for the field, but got ${replies.length}`,
        );
      }
      const reply = replies[0];

      if (!reply.content.articles.items.some((a: any) => a.id === args.id)) {
        throw new ForbiddenError("Article not found");
      }

      // run checks before updating DB
      await ctx.petitionsHelper.userCanWriteOnPetitionField(
        params.petitionId,
        params.fieldId,
        params.parentReplyId ?? null,
        reply.id,
        ctx.user!.id,
      );

      await ctx.petitions.updatePetitionFieldRepliesContent(
        params.petitionId,
        [
          {
            id: reply.id,
            content: {
              ...reply.content,
              ...buildClassification(reply.content),
            },
          },
        ],
        "User",
        ctx.user!.id,
      );
    }

    async function profileParamsResolver(params: NumericParams<ProfileReplyParams>) {
      const [profileValues, draftValues] = await Promise.all([
        ctx.profiles.loadProfileFieldValuesByProfileId(params.profileId),
        ctx.profiles.loadDraftProfileFieldValuesByProfileId(params.profileId),
      ]);

      const profileValue = profileValues.find(
        (v) =>
          v.profile_type_field_id === params.profileTypeFieldId &&
          v.type === "ADVERSE_MEDIA_SEARCH",
      );

      if (!profileValue) {
        throw new ForbiddenError("Expected a profile field value");
      }

      const draftValue = draftValues.find(
        (v) =>
          v.profile_type_field_id === params.profileTypeFieldId &&
          v.type === "ADVERSE_MEDIA_SEARCH",
      );

      const currentValue = draftValue ?? profileValue;

      // check if the article exists in content
      if (!currentValue.content.articles.items.some((a: any) => a.id === args.id)) {
        throw new ForbiddenError("Article not found");
      }

      // run checks before updating DB
      await ctx.profilesHelper.userCanWriteOnProfile(
        params.profileId,
        params.profileTypeFieldId,
        ctx.user!.id,
      );

      // classification will always happen over a draft value
      await ctx.profiles.upsertDraftProfileFieldValues(
        [
          {
            profileId: params.profileId,
            profileTypeFieldId: params.profileTypeFieldId,
            type: "ADVERSE_MEDIA_SEARCH",
            content: {
              ...currentValue.content,
              ...buildClassification(currentValue.content),
            },
          },
        ],
        ctx.user!.id,
      );
    }

    const params = parseReplyToken(args.token);

    if ("petitionId" in params) {
      await petitionParamsResolver(params);
    } else if ("profileId" in params) {
      await profileParamsResolver(params);
    }

    return {
      id: args.id,
      classification: args.classification,
      classifiedAt: args.classification ? addedAt : null,
    };
  },
});

export const saveAdverseMediaChanges = mutationField("saveAdverseMediaChanges", {
  type: "AdverseMediaArticleSearchResult",
  args: {
    token: nonNull(stringArg()),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("ADVERSE_MEDIA_SEARCH"),
    authenticatePetitionOrProfileReplyToken("token", "ADVERSE_MEDIA_SEARCH"),
  ),
  resolve: async (_, args, ctx) => {
    async function profileParamsResolver(params: NumericParams<ProfileReplyParams>) {
      const [profileValues, draftValues] = await Promise.all([
        ctx.profiles.loadProfileFieldValuesByProfileId(params.profileId),
        ctx.profiles.loadDraftProfileFieldValuesByProfileId(params.profileId),
      ]);

      const profileValue = profileValues.find(
        (v) =>
          v.profile_type_field_id === params.profileTypeFieldId &&
          v.type === "ADVERSE_MEDIA_SEARCH",
      );
      const draftValue = draftValues.find(
        (v) =>
          v.profile_type_field_id === params.profileTypeFieldId &&
          v.type === "ADVERSE_MEDIA_SEARCH",
      );

      if (!profileValue || !draftValue) {
        throw new ForbiddenError("Expected a profile field value");
      }

      // run checks before updating DB
      await ctx.profilesHelper.userCanWriteOnProfile(
        params.profileId,
        params.profileTypeFieldId,
        ctx.user!.id,
      );

      await ctx.profiles.updateProfileFieldValues(
        [
          {
            profileId: params.profileId,
            profileTypeFieldId: params.profileTypeFieldId,
            type: "ADVERSE_MEDIA_SEARCH",
            content: draftValue.content,
          },
        ],
        ctx.user!.id,
        ctx.user!.org_id,
      );

      await ctx.profiles.deleteDraftProfileFieldValue(draftValue.id);

      return ctx.profilesHelper.mapValueContentFromDatabase({
        type: "ADVERSE_MEDIA_SEARCH",
        content: draftValue.content,
        is_draft: false,
      });
    }

    const params = parseReplyToken(args.token);
    if ("profileId" in params) {
      return await profileParamsResolver(params);
    } else {
      // this feature is only intended for profiles
      throw new ForbiddenError("FORBIDDEN");
    }
  },
});
