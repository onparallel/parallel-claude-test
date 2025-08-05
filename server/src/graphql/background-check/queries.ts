import { booleanArg, nonNull, nullable, queryField, stringArg } from "nexus";
import { isNonNullish, isNullish } from "remeda";
import { ProfileFieldValue } from "../../db/__types";
import {
  BackgroundCheckContent,
  EntityDetailsResponse,
  EntitySearchRequest,
} from "../../services/BackgroundCheckService";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError, ForbiddenError } from "../helpers/errors";
import { dateArg } from "../helpers/scalars/DateTime";
import { authenticatePetitionOrProfileReplyToken } from "../integrations/authorizers";
import {
  NumericParams,
  parseReplyToken,
  PetitionReplyParams,
  ProfileReplyParams,
} from "../integrations/utils";
import { userHasFeatureFlag } from "../petition/authorizers";

export const backgroundCheckEntitySearch = queryField("backgroundCheckEntitySearch", {
  type: nonNull("BackgroundCheckEntitySearch"),
  authorize: authenticateAnd(
    userHasFeatureFlag("BACKGROUND_CHECK"),
    authenticatePetitionOrProfileReplyToken("token", "BACKGROUND_CHECK"),
  ),
  args: {
    token: nonNull(stringArg()),
    type: nullable("BackgroundCheckEntitySearchType"),
    name: nonNull(
      stringArg({
        description: "Name of the entity",
      }),
    ),
    date: dateArg({
      description:
        "Date of birth if entity is a Person, or date of registration if entity is a Company",
    }),
    country: nullable(
      stringArg({
        description: "Country of the entity",
      }),
    ),
    birthCountry: nullable(
      stringArg({
        description: "Birth country of the entity. Only valid for type PERSON",
      }),
    ),
    force: nullable(
      booleanArg({
        description:
          "Force a new search, even if the search criteria are the same as the previous search",
      }),
    ),
  },
  resolve: async (_, args, ctx) => {
    async function petitionParamsResolver(
      query: EntitySearchRequest,
      params: NumericParams<PetitionReplyParams>,
    ) {
      const fieldReplies = await ctx.petitions.loadRepliesForField(params.fieldId);
      const reply = fieldReplies.find(
        (r) =>
          r.type === "BACKGROUND_CHECK" &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      );

      // no reply is saved, create a new one if coming from a petition, return search if coming from a template
      if (isNullish(reply)) {
        const petition = (await ctx.petitions.loadPetition(params.petitionId))!;
        const search = await ctx.backgroundCheck.entitySearch(query, ctx.user!.org_id);
        const newContent = {
          query,
          search,
          entity: null,
        } as BackgroundCheckContent;

        if (!petition.is_template) {
          await ctx.petitionsHelper.userCanWriteOnPetitionField(
            params.petitionId,
            params.fieldId,
            params.parentReplyId ?? null,
            null,
            ctx.user!.id,
          );

          await ctx.petitions.createPetitionFieldReply(
            params.petitionId,
            {
              type: "BACKGROUND_CHECK",
              content: newContent,
              user_id: ctx.user!.id,
              petition_field_id: params.fieldId,
              parent_petition_field_reply_id: params.parentReplyId ?? null,
              status: "PENDING",
            },
            `User:${ctx.user!.id}`,
          );
        }
        return ctx.backgroundCheck.mapBackgroundCheckSearch(newContent);
      }

      // reply is defined and search terms are different, update reply content clearing entity and false positives
      if (
        reply.content.query.name !== query.name ||
        (reply.content.query.date ?? null) !== (query.date ?? null) ||
        (reply.content.query.type ?? null) !== (query.type ?? null) ||
        (reply.content.query.country ?? null) !== (query.country ?? null) ||
        (reply.content.query.birthCountry ?? null) !== (query.birthCountry ?? null)
      ) {
        await ctx.petitionsHelper.userCanWriteOnPetitionField(
          params.petitionId,
          params.fieldId,
          params.parentReplyId ?? null,
          reply.id,
          ctx.user!.id,
        );

        const search = await ctx.backgroundCheck.entitySearch(query, ctx.user!.org_id);
        const newContent = {
          query,
          search,
          entity: null,
        } as BackgroundCheckContent;

        await ctx.petitions.updatePetitionFieldRepliesContent(
          params.petitionId,
          [{ id: reply.id, content: newContent }],
          "User",
          ctx.user!.id,
        );

        return ctx.backgroundCheck.mapBackgroundCheckSearch(newContent);
      }

      // from this point reply is defined and search criteria is the same
      // if user is not forcing a refresh, return stored reply
      if (!args.force) {
        return ctx.backgroundCheck.mapBackgroundCheckSearch(reply.content);
      }

      // from this point i am forcing a refresh of the search
      // verify permissions and update the reply
      await ctx.petitionsHelper.userCanWriteOnPetitionField(
        params.petitionId,
        params.fieldId,
        params.parentReplyId ?? null,
        reply.id,
        ctx.user!.id,
      );

      const content = reply.content as BackgroundCheckContent;
      const newSearch = await ctx.backgroundCheck.entitySearch(query, ctx.user!.org_id);
      const newContent = {
        ...content,
        search: newSearch,
        falsePositives: content.falsePositives?.filter((fp) =>
          newSearch.items.some((item) => item.id === fp.id),
        ),
      } as BackgroundCheckContent;

      await ctx.petitions.updatePetitionFieldRepliesContent(
        params.petitionId,
        [{ id: reply.id, content: newContent }],
        "User",
        ctx.user!.id,
      );

      return ctx.backgroundCheck.mapBackgroundCheckSearch(newContent);
    }

    async function profileParamsResolver(
      query: EntitySearchRequest,
      params: NumericParams<ProfileReplyParams>,
    ) {
      async function createFirstTimeDraftSearch() {
        await ctx.profilesHelper.userCanWriteOnProfile(
          params.profileId,
          params.profileTypeFieldId,
          ctx.user!.id,
        );

        const search = await ctx.backgroundCheck.entitySearch(query, ctx.user!.org_id);
        const newContent = {
          query,
          search,
          entity: null,
        } as BackgroundCheckContent;

        await ctx.profiles.upsertDraftProfileFieldValues(
          [
            {
              profileId: params.profileId,
              profileTypeFieldId: params.profileTypeFieldId,
              type: "BACKGROUND_CHECK",
              content: newContent,
            },
          ],
          ctx.user!.id,
        );

        return {
          ...ctx.backgroundCheck.mapBackgroundCheckSearch(newContent),
          isDraft: true,
          hasStoredValue: false,
        };
      }

      async function forceRefreshSearch(currentValue: ProfileFieldValue, hasStoredValue: boolean) {
        await ctx.profilesHelper.userCanWriteOnProfile(
          params.profileId,
          params.profileTypeFieldId,
          ctx.user!.id,
        );

        const content = currentValue.content as BackgroundCheckContent;

        const newSearch = await ctx.backgroundCheck.entitySearch(query, ctx.user!.org_id);
        const newContent = {
          ...content,
          search: newSearch,
          falsePositives: content.falsePositives?.filter((fp) =>
            newSearch.items.some((item) => item.id === fp.id),
          ),
        } as BackgroundCheckContent;

        const isDraftContent = ctx.profilesHelper.isDraftContent("BACKGROUND_CHECK", newContent);
        const contentsAreEqual = ctx.petitionsHelper.contentsAreEqual(
          { type: "BACKGROUND_CHECK", content },
          { type: "BACKGROUND_CHECK", content: newContent },
        );

        if ((currentValue.is_draft && contentsAreEqual) || (isDraftContent && !contentsAreEqual)) {
          await ctx.profiles.upsertDraftProfileFieldValues(
            [
              {
                profileId: params.profileId,
                profileTypeFieldId: params.profileTypeFieldId,
                type: "BACKGROUND_CHECK",
                content: newContent,
              },
            ],
            ctx.user!.id,
          );

          return {
            ...ctx.backgroundCheck.mapBackgroundCheckSearch(newContent),
            isDraft: true,
            hasStoredValue,
          };
        } else {
          await ctx.profiles.updateProfileFieldValues(
            [
              {
                profileId: params.profileId,
                profileTypeFieldId: params.profileTypeFieldId,
                type: "BACKGROUND_CHECK",
                content: newContent,
              },
            ],
            ctx.user!.id,
            ctx.user!.org_id,
          );

          return {
            ...ctx.backgroundCheck.mapBackgroundCheckSearch(newContent),
            isDraft: false,
            hasStoredValue: true,
          };
        }
      }

      const { value, draftValue } = await ctx.profiles.loadProfileFieldValueWithDraft(params);
      const currentValue = draftValue ?? value;

      // first time search is always stored as draft:
      // - if no results, user needs to manually "save search criteria"
      // - if results, user has to classify in order to save the value
      if (isNullish(currentValue)) {
        return await createFirstTimeDraftSearch();
      }

      const content = currentValue.content as BackgroundCheckContent;

      const searchTermsAreEqual =
        (content.query.name ?? null) === (query.name ?? null) &&
        (content.query.date ?? null) === (query.date ?? null) &&
        (content.query.type ?? null) === (query.type ?? null) &&
        (content.query.country ?? null) === (query.country ?? null) &&
        (content.query.birthCountry ?? null) === (query.birthCountry ?? null);

      // search criteria is the same but user is forcing a refresh.
      if (searchTermsAreEqual && args.force) {
        return await forceRefreshSearch(currentValue, isNonNullish(value));
      }

      // the value has not been saved for the first time yet, so user can modify search anr overwrite draft
      if (isNullish(value) && !searchTermsAreEqual) {
        return await createFirstTimeDraftSearch();
      }

      // user cannot modify the search unless its a draft with no stored value
      return {
        ...ctx.backgroundCheck.mapBackgroundCheckSearch(content),
        isDraft: currentValue.is_draft,
        hasStoredValue: isNonNullish(value),
      };
    }

    try {
      const params = parseReplyToken(args.token);

      const query = {
        name: args.name,
        date: args.date ?? null,
        type: args.type ?? null,
        country: args.country ?? null,
        birthCountry: args.birthCountry ?? null,
      } as EntitySearchRequest;

      if ("petitionId" in params) {
        return await petitionParamsResolver(query, params);
      } else if ("profileId" in params) {
        return await profileParamsResolver(query, params);
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
        if (error.message === "INVALID_CREDENTIALS") {
          throw new ForbiddenError("Invalid credentials");
        }
      }
      throw error;
    }
  },
});

export const backgroundCheckEntityDetails = queryField("backgroundCheckEntityDetails", {
  type: nonNull("BackgroundCheckEntityDetails"),
  authorize: authenticateAnd(
    userHasFeatureFlag("BACKGROUND_CHECK"),
    authenticatePetitionOrProfileReplyToken("token", "BACKGROUND_CHECK"),
  ),
  args: {
    token: nonNull(stringArg()),
    entityId: nonNull(stringArg()),
    force: nullable(
      booleanArg({
        description: "Force an entity refresh",
      }),
    ),
  },
  resolve: async (_, args, ctx) => {
    async function petitionParamsResolver(params: NumericParams<PetitionReplyParams>) {
      const fieldReplies = await ctx.petitions.loadRepliesForField(params.fieldId);
      const reply = fieldReplies.find(
        (r) =>
          r.type === "BACKGROUND_CHECK" &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      );

      if (
        isNullish(reply) ||
        isNullish(reply.content?.entity) ||
        reply.content.entity.id !== args.entityId
      ) {
        // this entity is not saved as match, fetch details without saving
        return await ctx.backgroundCheck.entityProfileDetails(args.entityId, ctx.user!.id);
      }

      if (!args.force) {
        // i found a reply and it matches the entity, return it
        return reply.content.entity as EntityDetailsResponse;
      }

      // from this point on, we are forcing details refresh (reply is stored and entity is the same as the one we are looking for)
      await ctx.petitionsHelper.userCanWriteOnPetitionField(
        params.petitionId,
        params.fieldId,
        params.parentReplyId ?? null,
        reply?.id ?? null,
        ctx.user!.id,
      );

      const newDetails = await ctx.backgroundCheck.entityProfileDetails(
        args.entityId,
        ctx.user!.id,
        { skipCache: true },
      );

      const content = reply.content as BackgroundCheckContent;
      const newContent = {
        ...content,
        entity: newDetails,
      } as BackgroundCheckContent;

      await ctx.petitions.updatePetitionFieldRepliesContent(
        params.petitionId,
        [{ id: reply.id, content: newContent }],
        "User",
        ctx.user!.id,
      );

      return newDetails;
    }

    async function profileParamsResolver(params: NumericParams<ProfileReplyParams>) {
      const { value, draftValue } = await ctx.profiles.loadProfileFieldValueWithDraft(params);
      const currentValue = draftValue ?? value;

      if (
        isNullish(currentValue) ||
        isNullish(currentValue.content?.entity) ||
        currentValue.content.entity.id !== args.entityId
      ) {
        // this entity is not saved as match, fetch details without saving
        return await ctx.backgroundCheck.entityProfileDetails(args.entityId, ctx.user!.id);
      }

      if (!args.force) {
        return currentValue.content.entity as EntityDetailsResponse;
      }

      // from this point on, we are forcing details refresh (reply is stored and entity is the same as the one we are looking for)
      await ctx.profilesHelper.userCanWriteOnProfile(
        params.profileId,
        params.profileTypeFieldId,
        ctx.user!.id,
      );

      const newDetails = await ctx.backgroundCheck.entityProfileDetails(
        args.entityId,
        ctx.user!.id,
        { skipCache: true },
      );

      const content = currentValue.content as BackgroundCheckContent;
      const newContent = {
        ...content,
        entity: newDetails,
      } as BackgroundCheckContent;

      // update the value and trigger events even if nothing has changed
      await ctx.profiles.updateProfileFieldValues(
        [
          {
            profileId: params.profileId,
            profileTypeFieldId: params.profileTypeFieldId,
            type: "BACKGROUND_CHECK",
            content: newContent,
          },
        ],
        ctx.user!.id,
        ctx.user!.org_id,
      );

      return newDetails;
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
        if (error.message === "PROFILE_NOT_FOUND") {
          throw new ApolloError(
            `Couldn't find entity with id ${args.entityId}`,
            "PROFILE_NOT_FOUND",
          );
        } else if (error.message === "INVALID_ENTITY_SCHEMA") {
          throw new ApolloError(
            `Invalid entity schema for entity with id ${args.entityId}`,
            "INVALID_ENTITY_SCHEMA",
          );
        } else if (error.message === "INVALID_CREDENTIALS") {
          throw new ForbiddenError("Invalid credentials");
        }
      }
      throw error;
    }
  },
});
