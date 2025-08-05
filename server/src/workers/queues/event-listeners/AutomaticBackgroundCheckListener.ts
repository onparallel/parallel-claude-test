import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isNonNullish, isNullish } from "remeda";
import { PetitionFieldReply } from "../../../db/__types";
import { PetitionCompletedEvent } from "../../../db/events/PetitionEvent";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import {
  BACKGROUND_CHECK_SERVICE,
  EntitySearchRequest,
  IBackgroundCheckService,
} from "../../../services/BackgroundCheckService";
import { applyFieldVisibility } from "../../../util/fieldLogic";
import { EventListener } from "../EventProcessorQueue";

export const AUTOMATIC_BACKGROUND_CHECK_LISTENER = Symbol.for(
  "AUTOMATIC_BACKGROUND_CHECK_LISTENER",
);

@injectable()
export class AutomaticBackgroundCheckListener implements EventListener<"PETITION_COMPLETED"> {
  public readonly types: "PETITION_COMPLETED"[] = ["PETITION_COMPLETED"];

  constructor(
    @inject(PetitionRepository) private readonly petitions: PetitionRepository,
    @inject(BACKGROUND_CHECK_SERVICE) private readonly backgroundCheck: IBackgroundCheckService,
    @inject(FeatureFlagRepository) private readonly featureFlags: FeatureFlagRepository,
  ) {}

  public async handle(event: PetitionCompletedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);

    if (!petition) {
      return;
    }

    const hasFeatureFlag = await this.featureFlags.orgHasFeatureFlag(
      petition.org_id,
      "BACKGROUND_CHECK",
    );

    if (!hasFeatureFlag) {
      return;
    }

    const userId = "user_id" in event.data ? event.data.user_id : null;
    const petitionAccessId =
      "petition_access_id" in event.data ? event.data.petition_access_id : null;

    // run an automated background search for each field that has autoSearchConfig and the "name" field replied
    // if the query is the same as the last one or the field has a stored entity detail, it will not trigger a new search
    const backgroundCheckAutoSearchQueries =
      await this.buildAutomatedBackgroundCheckPetitionQueries(event.petition_id);

    await pMap(
      backgroundCheckAutoSearchQueries,
      async (data) => {
        if (isNonNullish(data.petitionFieldReplyId)) {
          await this.petitions.updatePetitionFieldRepliesContent(
            event.petition_id,
            [
              {
                id: data.petitionFieldReplyId,
                content: {
                  query: data.query,
                  search: await this.backgroundCheck.entitySearch(data.query, petition.org_id),
                  entity: null,
                },
              },
            ],
            userId ? "User" : "PetitionAccess",
            userId ?? petitionAccessId!,
          );
        } else {
          await this.petitions.createPetitionFieldReply(
            event.petition_id,
            {
              type: "BACKGROUND_CHECK",
              content: {
                query: data.query,
                search: await this.backgroundCheck.entitySearch(data.query, petition.org_id),
                entity: null,
              },
              ...("user_id" in event.data ? { user_id: event.data.user_id } : {}),
              ...("petition_access_id" in event.data
                ? { petition_access_id: event.data.petition_access_id }
                : {}),
              petition_field_id: data.petitionFieldId,
              parent_petition_field_reply_id: data.parentPetitionFieldReplyId,
              status: "PENDING",
            },
            userId ? `User:${userId}` : `PetitionAccess:${petitionAccessId}`,
          );
        }
      },
      { concurrency: 10 },
    );
  }

  private async buildAutomatedBackgroundCheckPetitionQueries(petitionId: number): Promise<
    {
      petitionFieldId: number;
      parentPetitionFieldReplyId: number | null;
      petitionFieldReplyId: number | null;
      query: EntitySearchRequest;
    }[]
  > {
    const [composedPetition] = await this.petitions.getComposedPetitionFieldsAndVariables([
      petitionId,
    ]);

    const visibleFields = applyFieldVisibility(composedPetition);
    // first look for BACKGROUND_CHECK fields in root (no parent)
    // fields must have autoSearchConfig with at least one SHORT_TEXT replied field
    const backgroundCheckRootFields = visibleFields
      .filter(
        (f) =>
          f.type === "BACKGROUND_CHECK" &&
          isNonNullish(f.options.autoSearchConfig?.name) &&
          Array.isArray(f.options.autoSearchConfig.name) &&
          f.options.autoSearchConfig.name.length > 0,
      )
      .map((backgroundCheck) => {
        // for non-child fields we only need to look for Name and Date fields on root level
        const nameReplies: Pick<PetitionFieldReply, "content">[] =
          backgroundCheck.options.autoSearchConfig.name
            .map((id: number) => visibleFields.find((f) => f.id === id)?.replies?.[0]) // take only 1st reply
            .filter(isNonNullish);

        const nameValue =
          nameReplies
            .map((r) => r.content.value)
            .join(" ")
            .trim() || null;

        if (isNullish(nameValue)) {
          // if name field is empty, we don't have any information to automate search so ignore.
          return null;
        }

        const dateReply = visibleFields.find(
          (field) => backgroundCheck.options.autoSearchConfig.date === field.id,
        )?.replies?.[0];

        const dateValue = dateReply?.content.value || null;

        const typeValue = backgroundCheck.options.autoSearchConfig?.type || null;

        const countryReply = visibleFields.find(
          (field) => backgroundCheck.options.autoSearchConfig.country === field.id,
        )?.replies?.[0];

        const countryValue = countryReply?.content.value || null;

        const birthCountryReply = visibleFields.find(
          (field) => backgroundCheck.options.autoSearchConfig.birthCountry === field.id,
        )?.replies?.[0];

        const birthCountryValue = birthCountryReply?.content.value || null;

        const currentBackgroundCheckReply = backgroundCheck.replies.at(0);
        if (
          currentBackgroundCheckReply?.status === "APPROVED" ||
          isNonNullish(currentBackgroundCheckReply?.content.entity) ||
          (currentBackgroundCheckReply?.content.query.name === nameValue &&
            currentBackgroundCheckReply?.content.query.date === dateValue &&
            currentBackgroundCheckReply?.content.query.type === typeValue &&
            currentBackgroundCheckReply?.content.query.country === countryValue &&
            currentBackgroundCheckReply?.content.query.birthCountry === birthCountryValue)
        ) {
          // reply is already approved, has an specific entity stored, or query is the same
          return null;
        }

        return {
          petitionFieldId: backgroundCheck.id,
          parentPetitionFieldReplyId: null,
          petitionFieldReplyId: currentBackgroundCheckReply?.id ?? null,
          query: {
            name: nameValue,
            date: dateValue,
            type: typeValue,
            country: countryValue,
            birthCountry: birthCountryValue,
          },
        };
      })
      .filter(isNonNullish);

    // same as before, but for BACKGROUND_CHECK children of FIELD_GROUPs
    const emptyBackgroundCheckChildFields = visibleFields
      .filter(
        (f) =>
          f.type === "FIELD_GROUP" &&
          f.replies.length > 0 &&
          f.children!.some(
            (c) =>
              c.type === "BACKGROUND_CHECK" &&
              isNonNullish(c.options.autoSearchConfig?.name) &&
              Array.isArray(c.options.autoSearchConfig.name) &&
              c.options.autoSearchConfig.name.length > 0,
          ),
      )
      .flatMap((fieldGroup) =>
        fieldGroup
          // get every eligible BACKGROUND_CHECK field inside the FIELD_GROUP
          .children!.filter(
            (c) =>
              c.type === "BACKGROUND_CHECK" &&
              isNonNullish(c.options.autoSearchConfig?.name) &&
              Array.isArray(c.options.autoSearchConfig.name) &&
              c.options.autoSearchConfig.name.length > 0,
          )
          .flatMap((backgroundCheck) =>
            // on each eligible field, create a query for each reply on the parent FIELD_GROUP
            fieldGroup.replies.map((groupReply) => {
              const nameReplies: Pick<PetitionFieldReply, "content">[] =
                backgroundCheck.options.autoSearchConfig.name
                  .map(
                    (id: number) =>
                      visibleFields
                        // Name field could be a sibling of the BACKGROUND_CHECK field, or could be in root level (no parent)
                        // se we need to flatten fields and children to find the right reply
                        .flatMap((f) => [f, ...(f.children ?? [])])
                        .find((f) => f.id === id)
                        ?.replies.filter(
                          (r) =>
                            isNullish(r.parent_petition_field_reply_id) ||
                            r.parent_petition_field_reply_id === groupReply.id,
                        )?.[0],
                  )
                  .filter(isNonNullish);

              const nameValue =
                nameReplies
                  .map((r) => r.content.value)
                  .join(" ")
                  .trim() || null;

              if (isNullish(nameValue)) {
                return null;
              }

              const dateReply = visibleFields
                .flatMap((f) => [f, ...(f.children ?? [])])
                .find((f) => f.id === backgroundCheck.options.autoSearchConfig.date)
                ?.replies.filter(
                  (r) =>
                    isNullish(r.parent_petition_field_reply_id) ||
                    r.parent_petition_field_reply_id === groupReply.id,
                )?.[0];

              const dateValue = dateReply?.content.value ?? null;
              const typeValue = backgroundCheck.options.autoSearchConfig?.type ?? null;

              const countryReply = visibleFields
                .flatMap((f) => [f, ...(f.children ?? [])])
                .find((f) => f.id === backgroundCheck.options.autoSearchConfig.country)
                ?.replies.filter(
                  (r) =>
                    isNullish(r.parent_petition_field_reply_id) ||
                    r.parent_petition_field_reply_id === groupReply.id,
                )?.[0];

              const countryValue = countryReply?.content.value ?? null;

              const birthCountryReply = visibleFields
                .flatMap((f) => [f, ...(f.children ?? [])])
                .find((f) => f.id === backgroundCheck.options.autoSearchConfig.birthCountry)
                ?.replies.filter(
                  (r) =>
                    isNullish(r.parent_petition_field_reply_id) ||
                    r.parent_petition_field_reply_id === groupReply.id,
                )?.[0];

              const birthCountryValue = birthCountryReply?.content.value ?? null;

              const currentBackgroundCheckReply = groupReply.children
                ?.find((c) => c.field.id === backgroundCheck.id)
                ?.replies.at(0);
              if (
                currentBackgroundCheckReply?.status === "APPROVED" ||
                isNonNullish(currentBackgroundCheckReply?.content.entity) ||
                (currentBackgroundCheckReply?.content.query.name === nameValue &&
                  currentBackgroundCheckReply?.content.query.date === dateValue &&
                  currentBackgroundCheckReply?.content.query.type === typeValue &&
                  currentBackgroundCheckReply?.content.query.country === countryValue &&
                  currentBackgroundCheckReply?.content.query.birthCountry === birthCountryValue)
              ) {
                // reply is already approved, has an specific entity stored, or query is the same
                return null;
              }

              return {
                petitionFieldId: backgroundCheck.id,
                parentPetitionFieldReplyId: groupReply.id,
                petitionFieldReplyId: currentBackgroundCheckReply?.id ?? null,
                query: {
                  name: nameValue,
                  date: dateValue,
                  type: typeValue,
                  country: countryValue,
                  birthCountry: birthCountryValue,
                },
              };
            }),
          ),
      )
      .filter(isNonNullish);

    return [...backgroundCheckRootFields, ...emptyBackgroundCheckChildFields];
  }
}
