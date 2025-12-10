import { booleanArg, list, mutationField, nonNull, stringArg } from "nexus";
import { isNonNullish, isNullish, uniqueBy } from "remeda";
import { BackgroundCheckContent } from "../../services/BackgroundCheckService";
import { includesSameElements } from "../../util/includesSameElements";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError, ForbiddenError } from "../helpers/errors";
import { SUCCESS } from "../helpers/Success";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { authenticatePetitionOrProfileReplyToken } from "../integrations/authorizers";
import {
  NumericParams,
  parseReplyToken,
  PetitionReplyParams,
  ProfileReplyParams,
} from "../integrations/utils";
import { userHasFeatureFlag } from "../petition/authorizers";

export const updateBackgroundCheckEntity = mutationField("updateBackgroundCheckEntity", {
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("BACKGROUND_CHECK"),
    authenticatePetitionOrProfileReplyToken("token", "BACKGROUND_CHECK"),
  ),
  args: {
    token: nonNull(stringArg()),
    entityId: stringArg(),
  },
  resolve: async (_, args, ctx) => {
    async function petitionParamsResolver(
      entityId: string | null,
      params: NumericParams<PetitionReplyParams>,
    ) {
      const replies = await ctx.petitions.loadRepliesForField(params.fieldId);
      const reply = replies.find(
        (r) =>
          r.type === "BACKGROUND_CHECK" &&
          isNonNullish(r.content.query) &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      );

      if (isNullish(reply)) {
        throw new ApolloError(`Can't find BACKGROUND_CHECK reply`, "REPLY_NOT_FOUND");
      }

      await ctx.petitionsHelper.userCanWriteOnPetitionField(
        params.petitionId,
        params.fieldId,
        params.parentReplyId ?? null,
        reply.id,
        ctx.user!.id,
      );

      const entity = isNonNullish(entityId)
        ? await ctx.backgroundCheck.entityProfileDetails(entityId, ctx.user!.id)
        : null;

      await ctx.petitions.updatePetitionFieldRepliesContent(
        params.petitionId,
        [
          {
            id: reply.id,
            content: {
              ...reply.content,
              entity,
            },
          },
        ],
        "User",
        ctx.user!.id,
      );
    }

    async function profileParamsResolver(
      entityId: string | null,
      params: NumericParams<ProfileReplyParams>,
    ) {
      await ctx.profilesHelper.userCanWriteOnProfile(
        params.profileId,
        params.profileTypeFieldId,
        ctx.user!.id,
      );

      const { value, draftValue } = await ctx.profiles.loadProfileFieldValueWithDraft(params);

      const currentValue = draftValue ?? value;

      if (isNullish(currentValue)) {
        throw new ApolloError(`Can't find BACKGROUND_CHECK profile field value`, "REPLY_NOT_FOUND");
      }

      if (value?.content.entity?.id === entityId && isNullish(draftValue)) {
        // avoid creating 2 values when running this mutation twice with the same entityId
        // but allow it if saving -> removing -> saving again
        return;
      }

      const entity = isNonNullish(entityId)
        ? await ctx.backgroundCheck.entityProfileDetails(entityId, ctx.user!.id)
        : null;

      if (isNonNullish(entity)) {
        const events = await ctx.profiles.updateProfileFieldValues(
          [
            {
              profileId: params.profileId,
              profileTypeFieldId: params.profileTypeFieldId,
              type: "BACKGROUND_CHECK",
              content: {
                ...currentValue.content,
                entity,
              },
            },
          ],
          ctx.user!.org_id,
          {
            userId: ctx.user!.id,
            source: "MANUAL",
          },
        );

        await ctx.profiles.createProfileUpdatedEvents(events, ctx.user!.org_id, {
          userId: ctx.user!.id,
          source: "MANUAL",
        });
      } else {
        // when removing entity go back to draft without removing value
        await ctx.profiles.upsertDraftProfileFieldValues(
          [
            {
              profileId: params.profileId,
              profileTypeFieldId: params.profileTypeFieldId,
              type: "BACKGROUND_CHECK",
              content: {
                ...currentValue.content,
                entity: null,
              },
            },
          ],
          ctx.user!.id,
          "MANUAL",
        );
      }
    }

    try {
      const params = parseReplyToken(args.token);

      if ("petitionId" in params) {
        await petitionParamsResolver(args.entityId ?? null, params);
      } else if ("profileId" in params) {
        await profileParamsResolver(args.entityId ?? null, params);
      }

      return SUCCESS;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PROFILE_NOT_FOUND") {
          throw new ApolloError("Profile not found", "PROFILE_NOT_FOUND");
        }
        if (error.message === "INVALID_CREDENTIALS") {
          throw new ForbiddenError("Invalid credentials");
        }
      }
      throw error;
    }
  },
});

export const updateBackgroundCheckSearchFalsePositives = mutationField(
  "updateBackgroundCheckSearchFalsePositives",
  {
    type: "Success",
    authorize: authenticateAnd(
      userHasFeatureFlag("BACKGROUND_CHECK"),
      authenticatePetitionOrProfileReplyToken("token", "BACKGROUND_CHECK"),
    ),
    args: {
      token: nonNull(stringArg()),
      entityIds: nonNull(list(nonNull(stringArg()))),
      isFalsePositive: nonNull(booleanArg()),
    },
    validateArgs: notEmptyArray("entityIds"),
    resolve: async (_, args, ctx) => {
      async function petitionParamsResolver(params: NumericParams<PetitionReplyParams>) {
        const replies = await ctx.petitions.loadRepliesForField(params.fieldId);
        const reply = replies.find(
          (r) =>
            r.type === "BACKGROUND_CHECK" &&
            isNonNullish(r.content.query) &&
            r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
        );

        if (isNullish(reply)) {
          throw new ApolloError(`Can't find BACKGROUND_CHECK reply`, "REPLY_NOT_FOUND");
        }

        await ctx.petitionsHelper.userCanWriteOnPetitionField(
          params.petitionId,
          params.fieldId,
          params.parentReplyId ?? null,
          reply.id,
          ctx.user!.id,
        );

        const content = reply.content as BackgroundCheckContent;

        const newFalsePositives = args.isFalsePositive
          ? uniqueBy(
              (content.falsePositives ?? []).concat(
                args.entityIds.map((id) => ({
                  id,
                  addedAt: new Date(),
                  addedByUserId: ctx.user!.id,
                })),
              ),
              (fp) => fp.id,
            )
          : (content.falsePositives ?? []).filter(({ id }) => !args.entityIds.includes(id));

        // if newFalsePositives are same as before, do nothing
        if (
          includesSameElements(content.falsePositives, newFalsePositives, (a, b) => a.id === b.id)
        ) {
          return;
        }

        await ctx.petitions.updatePetitionFieldRepliesContent(
          params.petitionId,
          [
            {
              id: reply.id,
              content: {
                ...content,
                falsePositives: newFalsePositives,
              },
            },
          ],
          "User",
          ctx.user!.id,
        );
      }

      async function profileParamsResolver(params: NumericParams<ProfileReplyParams>) {
        await ctx.profilesHelper.userCanWriteOnProfile(
          params.profileId,
          params.profileTypeFieldId,
          ctx.user!.id,
        );

        const { value, draftValue } = await ctx.profiles.loadProfileFieldValueWithDraft(params);

        const currentValue = draftValue ?? value;

        if (isNullish(currentValue) || isNonNullish(currentValue.content.entity)) {
          throw new ForbiddenError("FORBIDDEN");
        }

        const content = currentValue.content as BackgroundCheckContent;

        const newFalsePositives = args.isFalsePositive
          ? uniqueBy(
              (content.falsePositives ?? []).concat(
                args.entityIds.map((id) => ({
                  id,
                  addedAt: new Date(),
                  addedByUserId: ctx.user!.id,
                })),
              ),
              (fp) => fp.id,
            )
          : (content.falsePositives ?? []).filter(({ id }) => !args.entityIds.includes(id));

        // if newFalsePositives are same as before, do nothing
        if (
          includesSameElements(content.falsePositives, newFalsePositives, (a, b) => a.id === b.id)
        ) {
          return;
        }

        if (!args.isFalsePositive) {
          // when removing a false positive, we need to generate a draft as the content will always be incomplete
          await ctx.profiles.upsertDraftProfileFieldValues(
            [
              {
                profileId: params.profileId,
                profileTypeFieldId: params.profileTypeFieldId,
                type: "BACKGROUND_CHECK",
                content: {
                  ...content,
                  falsePositives: newFalsePositives,
                },
              },
            ],
            ctx.user!.id,
            "MANUAL",
          );
        } else {
          // when adding a false positive, we need to check if every item in search is now a false positive
          // - if every item is false positive, remove the draft and create a stored value
          // - if not, update the draft
          if (newFalsePositives.length === content.search.totalCount) {
            const events = await ctx.profiles.updateProfileFieldValues(
              [
                {
                  profileId: params.profileId,
                  profileTypeFieldId: params.profileTypeFieldId,
                  type: "BACKGROUND_CHECK",
                  content: {
                    ...content,
                    falsePositives: newFalsePositives,
                  },
                },
              ],
              ctx.user!.org_id,
              {
                userId: ctx.user!.id,
                source: "MANUAL",
              },
            );
            await ctx.profiles.createProfileUpdatedEvents(events, ctx.user!.org_id, {
              userId: ctx.user!.id,
              source: "MANUAL",
            });
          } else {
            await ctx.profiles.upsertDraftProfileFieldValues(
              [
                {
                  profileId: params.profileId,
                  profileTypeFieldId: params.profileTypeFieldId,
                  type: "BACKGROUND_CHECK",
                  content: {
                    ...content,
                    falsePositives: newFalsePositives,
                  },
                },
              ],
              ctx.user!.id,
              "MANUAL",
            );
          }
        }
      }

      const params = parseReplyToken(args.token);

      if ("petitionId" in params) {
        await petitionParamsResolver(params);
      } else if ("profileId" in params) {
        await profileParamsResolver(params);
      }

      return SUCCESS;
    },
  },
);
