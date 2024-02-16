import { idArg, nonNull, nullable, queryField, stringArg } from "nexus";
import { isDefined } from "remeda";
import { InvalidCredentialsError } from "../../integrations/GenericIntegration";
import {
  EntityDetailsResponse,
  EntitySearchResponse,
} from "../../services/background-check-clients/BackgroundCheckClient";
import { toGlobalId } from "../../util/globalId";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError, ForbiddenError } from "../helpers/errors";
import { dateArg, datetimeArg } from "../helpers/scalars/DateTime";
import { userHasEnabledIntegration, userHasFeatureFlag } from "../petition/authorizers";
import { authenticateBackgroundCheckToken } from "./authorizers";
import { parseBackgroundCheckToken } from "./utils";

/** @deprecated */
export const queries = queryField((t) => {
  t.paginationField("dowJonesKycEntitySearch", {
    type: "DowJonesKycEntitySearchResult",
    authorize: authenticateAnd(
      userHasEnabledIntegration("DOW_JONES_KYC"),
      userHasFeatureFlag("DOW_JONES_KYC"),
    ),
    extendArgs: {
      name: nonNull(stringArg()),
      dateOfBirth: datetimeArg(),
    },
    resolve: async (_, args, ctx) => {
      const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
        ctx.user!.org_id,
        "DOW_JONES_KYC",
      );
      try {
        const result = await ctx.dowJonesKyc.riskEntitySearch(integration.id, args);
        return {
          totalCount: result.meta.total_count,
          items: (result.data ?? []).map((i) => ({
            id: toGlobalId("DowJonesKycEntitySearchResult", i.id),
            profileId: i.id,
            type: i.attributes.type,
            name: i.attributes.primary_name,
            title: i.attributes.title,
            countryTerritoryName:
              i.attributes.country_territory_code !== "NOTK"
                ? i.attributes.country_territory_name
                : null,
            isSubsidiary: i.attributes.is_subsidiary,
            iconHints: i.attributes.icon_hints,
            gender: i.attributes.gender,
            dateOfBirth: i.attributes.date_of_birth
              ? {
                  year: parseInt(i.attributes.date_of_birth[0].year) || null,
                  month: parseInt(i.attributes.date_of_birth[0].month) || null,
                  day: parseInt(i.attributes.date_of_birth[0].day) || null,
                }
              : null,
          })),
        };
      } catch (e) {
        if (e instanceof InvalidCredentialsError && e.code === "FORBIDDEN") {
          throw new ApolloError("Forbidden", "INVALID_CREDENTIALS");
        } else {
          throw e;
        }
      }
    },
  });

  t.field("dowJonesKycEntityProfile", {
    type: "DowJonesKycEntityProfileResult",
    authorize: authenticateAnd(
      userHasEnabledIntegration("DOW_JONES_KYC"),
      userHasFeatureFlag("DOW_JONES_KYC"),
    ),
    args: {
      profileId: nonNull(idArg()),
    },
    resolve: async (_, args, ctx) => {
      try {
        const redisKey = `DowJones:${args.profileId}`;
        const cachedData = await ctx.redis.get(redisKey);
        if (cachedData) {
          return JSON.parse(cachedData);
        }

        const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
          ctx.user!.org_id,
          "DOW_JONES_KYC",
        );

        const profile = await ctx.dowJonesKyc.riskEntityProfile(integration.id, args.profileId);

        const citizenship = (
          profile.data.attributes.person?.country_territory_details.citizenship ?? []
        ).find((c) => c.code !== "NOTK"); // NOTK is "Not Known", this info is irrelevant so we will filter it
        const jurisdiction = (
          profile.data.attributes.person?.country_territory_details.jurisdiction ?? []
        ).find((c) => c.code !== "NOTK");
        const residence = (
          profile.data.attributes.person?.country_territory_details.residence ?? []
        ).find((c) => c.code !== "NOTK");

        const result = {
          id: toGlobalId("DowJonesKycEntityProfileResult", profile.data.id),
          profileId: profile.data.id,
          type: profile.data.attributes.basic.type,
          name: ctx.dowJonesKyc.entityFullName(
            profile.data.attributes.basic.name_details.primary_name,
          ),
          iconHints:
            profile.data.attributes.person?.icon_hints ??
            profile.data.attributes.entity?.icon_hints ??
            [],
          sanctions: (profile.data.attributes.list_reference?.sanctions_lists ?? []).map(
            (s, id) => ({
              id,
              name: s.name,
              sources: s.sources,
              fromDate: s.from_date ?? null,
            }),
          ),
          relationships: (profile.data.attributes.relationship?.connection_details ?? []).map(
            (r) => ({
              profileId: r.profile_id,
              type: r.type,
              connectionType: r.connection_type,
              iconHints: r.icon_hints,
              name: ctx.dowJonesKyc.entityFullName(r.name_detail),
            }),
          ),
          placeOfBirth: profile.data.attributes.person?.places_of_birth
            ? {
                descriptor: profile.data.attributes.person!.places_of_birth[0].country.descriptor,
                countryCode: profile.data.attributes.person!.places_of_birth[0].country.iso_alpha2,
              }
            : null,
          dateOfBirth: profile.data.attributes.person?.date_details?.birth?.[0].date ?? null,
          citizenship: citizenship
            ? {
                descriptor: citizenship.descriptor,
                countryCode: citizenship.iso_alpha2,
              }
            : null,
          residence: residence
            ? {
                descriptor: residence.descriptor,
                countryCode: residence.iso_alpha2,
              }
            : null,
          jurisdiction: jurisdiction
            ? {
                descriptor: jurisdiction.descriptor,
                countryCode: jurisdiction.iso_alpha2,
              }
            : null,
          isDeceased: profile.data.attributes.person?.is_deceased,
          dateOfRegistration:
            profile.data.attributes.entity?.date_details?.registration?.[0].date ?? null,
          updatedAt: new Date(),
        };

        await ctx.redis.set(redisKey, JSON.stringify(result), 15 * 60); // 15 min cache

        return result;
      } catch (error) {
        if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") {
          throw new ApolloError(
            `Couldn't find profile with id ${args.profileId}`,
            "PROFILE_NOT_FOUND",
          );
        } else if (error instanceof InvalidCredentialsError && error.code === "FORBIDDEN") {
          throw new ApolloError("Forbidden", "INVALID_CREDENTIALS");
        }
        throw error;
      }
    },
  });
});

export const backgroundCheckEntitySearch = queryField("backgroundCheckEntitySearch", {
  type: nonNull("BackgroundCheckEntitySearch"),
  authorize: authenticateAnd(
    userHasFeatureFlag("BACKGROUND_CHECK"),
    authenticateBackgroundCheckToken("token"),
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
  },
  resolve: async (_, args, ctx) => {
    try {
      const params = parseBackgroundCheckToken(args.token);

      const query = {
        name: args.name,
        date: args.date ?? null,
        type: args.type ?? null,
      };

      const petition = await ctx.petitions.loadPetition(params.petitionId);
      const fieldReplies = await ctx.petitions.loadRepliesForField(params.fieldId);

      // look for a reply in the field that matches the search criteria
      const reply = fieldReplies.find(
        (r) =>
          r.type === "BACKGROUND_CHECK" &&
          isDefined(r.content.search) &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      );

      if (
        isDefined(reply) &&
        reply.content.query.name === query.name &&
        reply.content.query.date === query.date &&
        reply.content.query.type === query.type
      ) {
        // i found a reply and it matches the search criteria, return it
        return reply.content.search as EntitySearchResponse;
      }

      if (petition?.status === "CLOSED") {
        throw new ForbiddenError("The petition is closed and does not accept new replies");
      }

      const canBeReplied = await ctx.petitions.fieldsCanBeReplied(
        [{ id: params.fieldId, parentReplyId: params.parentReplyId ?? null }],
        true,
      );

      if (!canBeReplied) {
        throw new ApolloError(
          "The field is already replied and does not accept multiple replies",
          "FIELD_ALREADY_REPLIED_ERROR",
        );
      }

      if (isDefined(reply)) {
        const updateCheck = await ctx.petitions.repliesCanBeUpdated([reply.id]);
        if (updateCheck === "REPLY_ALREADY_APPROVED") {
          throw new ApolloError(
            `The reply has been approved and cannot be updated.`,
            "REPLY_ALREADY_APPROVED_ERROR",
          );
        } else if (updateCheck === "REPLY_NOT_FOUND") {
          throw new ForbiddenError("FORBIDDEN");
        }
      }

      const search = await ctx.backgroundCheck.entitySearch(query);
      if (isDefined(reply)) {
        // reply is defined but search criteria doesn't match, update it
        await ctx.petitions.updatePetitionFieldRepliesContent(
          params.petitionId,
          [
            {
              id: reply.id,
              content: {
                query,
                search,
                entity: null,
              },
            },
          ],
          ctx.user!,
        );
      } else if (petition?.is_template === false) {
        // reply does not exist, create a new one
        await ctx.orgCredits.ensurePetitionHasConsumedCredit(
          params.petitionId,
          `User:${ctx.user!.id}`,
        );

        // create a new reply with the correct search criteria
        await ctx.petitions.createPetitionFieldReply(
          params.petitionId,
          {
            type: "BACKGROUND_CHECK",
            content: { query, search, entity: null },
            user_id: ctx.user!.id,
            petition_field_id: params.fieldId,
            parent_petition_field_reply_id: params.parentReplyId ?? null,
            status: "PENDING",
          },
          `User:${ctx.user!.id}`,
        );
      }

      return search;
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
    authenticateBackgroundCheckToken("token"),
  ),
  args: {
    token: nonNull(stringArg()),
    entityId: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    try {
      const params = parseBackgroundCheckToken(args.token);

      const fieldReplies = await ctx.petitions.loadRepliesForField(params.fieldId);

      // look for a reply in the field that matches the provided entity
      const reply = fieldReplies.find(
        (r) =>
          r.type === "BACKGROUND_CHECK" &&
          r.content.entity?.id === args.entityId &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      );

      if (isDefined(reply)) {
        // i found a reply and it matches the entity, return it
        return reply.content.entity as EntityDetailsResponse;
      }

      return await ctx.backgroundCheck.entityProfileDetails(args.entityId, ctx.user!.id);
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
