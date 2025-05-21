import { list, nonNull, nullable, objectType, queryField, stringArg } from "nexus";
import { outdent } from "outdent";
import { isNonNullish, isNullish } from "remeda";
import { schema } from "../../util/jsonSchema";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { maxLength } from "../helpers/validators/maxLength";
import { authenticatePetitionOrProfileReplyToken } from "../integrations/authorizers";
import {
  NumericParams,
  parseReplyToken,
  PetitionReplyParams,
  ProfileReplyParams,
} from "../integrations/utils";
import { userHasFeatureFlag } from "../petition/authorizers";
import { validateAdverseMediaSearchTermInput } from "./validators";

export const adverseMediaEntitySuggest = queryField("adverseMediaEntitySuggest", {
  description: "Suggest entity names based on a search term",
  type: nonNull(
    list(
      nonNull(
        objectType({
          name: "AdverseMediaEntitySuggestItem",
          definition(t) {
            t.nonNull.string("id");
            t.nonNull.string("name");
          },
        }),
      ),
    ),
  ),
  args: { searchTerm: nonNull(stringArg()) },
  authorize: authenticateAnd(userHasFeatureFlag("ADVERSE_MEDIA_SEARCH")),
  validateArgs: maxLength("searchTerm", 100),
  resolve: async (_, args, ctx) => {
    return await ctx.adverseMedia.searchEntities(args.searchTerm);
  },
});

export const adverseMediaArticleSearch = queryField("adverseMediaArticleSearch", {
  type: nullable("AdverseMediaArticleSearchResult"),
  args: {
    token: nonNull(stringArg()),
    search: nullable(list(nonNull("AdverseMediaSearchTermInput"))),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("ADVERSE_MEDIA_SEARCH"),
    authenticatePetitionOrProfileReplyToken("token", "ADVERSE_MEDIA_SEARCH"),
  ),
  validateArgs: validateAdverseMediaSearchTermInput("search"),
  resolve: async (_, args, ctx) => {
    async function petitionParamsResolver(params: NumericParams<PetitionReplyParams>) {
      const fieldReplies = await ctx.petitions.loadRepliesForField(params.fieldId);

      // look for a reply in the field that matches the search criteria
      const reply = fieldReplies.find(
        (r) =>
          r.type === "ADVERSE_MEDIA_SEARCH" &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      );

      if (isNullish(args.search)) {
        // if no search terms provided, return reply from DB
        if (isNullish(reply)) {
          return null;
        }
        return await ctx.petitionsHelper.mapReplyContentFromDatabase(reply);
      }

      await ctx.petitionsHelper.userCanWriteOnPetitionField(
        params.petitionId,
        params.fieldId,
        params.parentReplyId ?? null,
        reply?.id ?? null,
        ctx.user!.id,
      );

      const classifiedArticleIds = [
        ...(reply?.content?.relevant_articles ?? []),
        ...(reply?.content?.irrelevant_articles ?? []),
        ...(reply?.content?.dismissed_articles ?? []),
      ].map((a) => a.id);

      const articlesSearch = await ctx.adverseMedia.searchArticles(args.search, {
        excludeArticles: classifiedArticleIds,
      });

      const content = ctx.adverseMedia.buildAdverseMediaSearchContent(
        args.search,
        articlesSearch,
        reply?.content ?? null,
      );

      if (isNonNullish(reply)) {
        // reply is defined but search criteria doesn't match, update it
        await ctx.petitions.updatePetitionFieldRepliesContent(
          params.petitionId,
          [
            {
              id: reply.id,
              content,
            },
          ],
          ctx.user!,
        );
      } else {
        const petition = await ctx.petitions.loadPetition(params.petitionId);
        if (petition?.is_template === false) {
          // create a new reply with the correct search criteria
          await ctx.petitions.createPetitionFieldReply(
            params.petitionId,
            {
              type: "ADVERSE_MEDIA_SEARCH",
              content,
              user_id: ctx.user!.id,
              petition_field_id: params.fieldId,
              parent_petition_field_reply_id: params.parentReplyId ?? null,
              status: "PENDING",
            },
            `User:${ctx.user!.id}`,
          );
        }
      }

      return await ctx.petitionsHelper.mapReplyContentFromDatabase({
        type: "ADVERSE_MEDIA_SEARCH",
        content,
        anonymized_at: null,
      });
    }

    async function profileParamsResolver(params: NumericParams<ProfileReplyParams>) {
      const [draftValues, profileValues] = await Promise.all([
        ctx.profiles.loadDraftProfileFieldValuesByProfileId(params.profileId),
        ctx.profiles.loadProfileFieldValuesByProfileId(params.profileId),
      ]);

      const draftValue = draftValues.find(
        (v) =>
          v.profile_type_field_id === params.profileTypeFieldId &&
          v.type === "ADVERSE_MEDIA_SEARCH",
      );

      const profileValue = profileValues.find(
        (v) =>
          v.profile_type_field_id === params.profileTypeFieldId &&
          v.type === "ADVERSE_MEDIA_SEARCH",
      );

      const currentValue = draftValue ?? profileValue;

      if (isNullish(args.search)) {
        // if no search terms provided, return value from DB
        if (isNullish(currentValue)) {
          return null;
        }
        return await ctx.profilesHelper.mapValueContentFromDatabase(currentValue);
      }

      await ctx.profilesHelper.userCanWriteOnProfile(
        params.profileId,
        params.profileTypeFieldId,
        ctx.user!.id,
      );

      const classifiedArticleIds = [
        ...(currentValue?.content?.relevant_articles ?? []),
        ...(currentValue?.content?.irrelevant_articles ?? []),
        ...(currentValue?.content?.dismissed_articles ?? []),
      ].map((a) => a.id);

      const articlesSearch = await ctx.adverseMedia.searchArticles(args.search, {
        excludeArticles: classifiedArticleIds,
      });

      const content = ctx.adverseMedia.buildAdverseMediaSearchContent(
        args.search,
        articlesSearch,
        currentValue?.content ?? null,
      );

      if (isNullish(currentValue)) {
        // no value found on the profile, create a new one
        await ctx.profiles.updateProfileFieldValues(
          [
            {
              profileId: params.profileId,
              profileTypeFieldId: params.profileTypeFieldId,
              type: "ADVERSE_MEDIA_SEARCH",
              content,
            },
          ],
          ctx.user!.id,
          ctx.user!.org_id,
        );

        return await ctx.profilesHelper.mapValueContentFromDatabase({
          type: "ADVERSE_MEDIA_SEARCH",
          content,
          is_draft: false,
        });
      } else {
        // a value already exists, instead of updating it we will create or update its "draft" version
        await ctx.profiles.upsertDraftProfileFieldValues(
          [
            {
              profileId: params.profileId,
              profileTypeFieldId: params.profileTypeFieldId,
              type: "ADVERSE_MEDIA_SEARCH",
              content,
            },
          ],
          ctx.user!.id,
        );
        return await ctx.profilesHelper.mapValueContentFromDatabase({
          type: "ADVERSE_MEDIA_SEARCH",
          content,
          is_draft: true,
        });
      }
    }

    try {
      const params = parseReplyToken(args.token);

      if ("petitionId" in params) {
        return await petitionParamsResolver(params);
      } else if ("profileId" in params) {
        return await profileParamsResolver(params);
      } else {
        return null as never;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PETITION_SEND_LIMIT_REACHED") {
          throw new ApolloError(
            "Can't submit a reply due to lack of credits",
            "PETITION_SEND_LIMIT_REACHED",
          );
        }
      }
      throw error;
    }
  },
});

export const adverseMediaArticleDetails = queryField("adverseMediaArticleDetails", {
  type: nonNull("AdverseMediaArticle"),
  args: {
    id: nonNull(stringArg()),
    token: nonNull(stringArg()),
    search: list(nonNull("AdverseMediaSearchTermInput")),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("ADVERSE_MEDIA_SEARCH"),
    authenticatePetitionOrProfileReplyToken("token", "ADVERSE_MEDIA_SEARCH"),
  ),
  validateArgs: validateAdverseMediaSearchTermInput("search"),
  resolve: async (_, args, ctx) => {
    async function petitionParamsResolver(params: NumericParams<PetitionReplyParams>) {
      const article = await ctx.adverseMedia.fetchArticle(args.id, args.search);

      const fieldReplies = await ctx.petitions.loadRepliesForField(params.fieldId);
      const reply = fieldReplies.find(
        (r) =>
          r.type === "ADVERSE_MEDIA_SEARCH" &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      );

      return ctx.adverseMedia.addRelevanceToArticle(article, reply?.content);
    }

    async function profileParamsResolver(params: NumericParams<ProfileReplyParams>) {
      const [draftValues, profileValues] = await Promise.all([
        ctx.profiles.loadDraftProfileFieldValuesByProfileId(params.profileId),
        ctx.profiles.loadProfileFieldValuesByProfileId(params.profileId),
      ]);

      const article = await ctx.adverseMedia.fetchArticle(args.id, args.search);

      const draftValue = draftValues.find(
        (v) =>
          v.profile_type_field_id === params.profileTypeFieldId &&
          v.type === "ADVERSE_MEDIA_SEARCH",
      );

      const profileValue = profileValues.find(
        (v) =>
          v.profile_type_field_id === params.profileTypeFieldId &&
          v.type === "ADVERSE_MEDIA_SEARCH",
      );

      const currentValue = draftValue ?? profileValue;

      return ctx.adverseMedia.addRelevanceToArticle(article, currentValue?.content);
    }

    try {
      const params = parseReplyToken(args.token);
      if ("petitionId" in params) {
        return await petitionParamsResolver(params);
      } else if ("profileId" in params) {
        return await profileParamsResolver(params);
      } else {
        return null as never;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "ARTICLE_NOT_FOUND") {
        throw new ApolloError("Article not found", "ARTICLE_NOT_FOUND");
      }

      throw error;
    }
  },
});

export const adverseMediaAlternativeSearchSuggestions = queryField(
  "adverseMediaAlternativeSearchSuggestions",
  {
    description: "Suggest alternative search terms based on the current search",
    type: nonNull(list(nonNull("AdverseMediaSearchTerm"))),
    args: {
      token: nonNull(stringArg()),
      search: nonNull(stringArg()),
    },
    authorize: authenticateAnd(
      userHasFeatureFlag("ADVERSE_MEDIA_SEARCH"),
      authenticatePetitionOrProfileReplyToken("token", "ADVERSE_MEDIA_SEARCH"),
    ),
    resolve: async (_, args, ctx) => {
      const AlternativeNamesSchema = schema({
        title: "AlternativeNames",
        type: "object",
        required: ["suggestions"],
        properties: {
          suggestions: {
            type: "array",
            items: { type: "string" },
          },
        },
      } as const);

      const data = await ctx.aiAssistant.getJsonCompletion(
        "gpt-4o-mini",
        [
          {
            role: "system",
            content: outdent`
              You will receive a full name. Your task is to generate up to three name variants that match the format typically used in news articles.
              Prioritize the format “First Name + First Surname”.
              Use common conventions from news reporting.
              Return the result as a JSON array of strings, no additional text.
              None of the names you return should be the same as the input name.
              Rules:
                1. The main format should be FirstName + FirstSurname.
                2. If there's a middle name, consider a variant with FirstName + MiddleName + FirstSurname.
                3. Optionally include FirstName + FirstSurname + SecondSurname if the second surname is relevant or the name is commonly seen that way.
                4. Do not reorder or use commas.
                5. Avoid honorifics, prefixes, or suffixes.
                6. Keep all names in natural person format.

              Example:
              input: Emilio Cuatrecasas Figueras
              output: ["Emilio Cuatrecasas", "Emilio Cuatrecasas Figueras", "Emilio C. Figueras"]
            `,
          },
          {
            role: "user",
            content: args.search,
          },
        ],
        AlternativeNamesSchema,
      );

      return data?.suggestions.map((term) => ({ label: term, term })) ?? [];
    },
  },
);
