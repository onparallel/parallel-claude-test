import { inject, injectable } from "inversify";
import { isNonNullish, isNullish, unique } from "remeda";
import { ProfileFieldValue, ProfileTypeField } from "../../../db/__types";
import {
  ProfileFieldValueUpdatedEvent,
  ProfileUpdatedEvent,
} from "../../../db/events/ProfileEvent";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { EntitySearchRequest } from "../../../services/BackgroundCheckService";
import {
  ProfileTypeFieldActivationCondition,
  ProfileTypeFieldOptions,
} from "../../../services/ProfileTypeFieldService";
import { IQueuesService, QUEUES_SERVICE } from "../../../services/QueuesService";
import { EventListener } from "../EventProcessorQueue";

export const AUTOMATIC_BACKGROUND_CHECK_PROFILE_LISTENER = Symbol.for(
  "AUTOMATIC_BACKGROUND_CHECK_PROFILE_LISTENER",
);

@injectable()
export class AutomaticBackgroundCheckProfileListener implements EventListener<"PROFILE_UPDATED"> {
  public readonly types: "PROFILE_UPDATED"[] = ["PROFILE_UPDATED"];

  constructor(
    @inject(QUEUES_SERVICE) private queues: IQueuesService,
    @inject(ProfileRepository) private readonly profiles: ProfileRepository,
    @inject(FeatureFlagRepository) private readonly featureFlags: FeatureFlagRepository,
  ) {}

  public async handle(event: ProfileUpdatedEvent) {
    const hasFeatureFlag = await this.featureFlags.orgHasFeatureFlag(
      event.org_id,
      "BACKGROUND_CHECK",
    );

    if (!hasFeatureFlag) {
      return;
    }

    const profile = await this.profiles.loadProfile(event.profile_id);

    if (!profile || profile.status !== "OPEN") {
      return;
    }

    // look for properties of type BACKGROUND_CHECK with autoSearchConfig enabled
    const backgroundCheckProperties = (
      await this.profiles.loadProfileTypeFieldsByProfileTypeIdFiltered({
        profileTypeId: profile.profile_type_id,
        filter: [{ type: "BACKGROUND_CHECK" }],
      })
    ).filter((f) => isNonNullish(f.options.autoSearchConfig));

    if (backgroundCheckProperties.length === 0) {
      // profile does not have any background check properties, nothing to do
      return;
    }

    // get every PROFILE_FIELD_VALUE_UPDATED events for this profile down to the previous PROFILE_UPDATED
    // this way we can see the reasons of the PROFILE_UPDATED event and value if an automatic background check is required
    const previousEvents = await this.profiles.getProfileEvents(event.profile_id, {
      type: "PROFILE_FIELD_VALUE_UPDATED",
      before: { eventId: event.id },
      after: { type: "PROFILE_UPDATED" },
    });

    if (!this.validateProfileUpdatedReason(previousEvents, backgroundCheckProperties)) {
      // this PROFILE_UPDATED event does not require a background check, as none of the configured properties for the queries have been updated
      return;
    }

    const profileValues = await this.profiles.loadProfileFieldValuesByProfileId(profile.id);

    for (const bgCheckProperty of backgroundCheckProperties) {
      const bgCheckValue = profileValues.find(
        (v) => v.profile_type_field_id === bgCheckProperty.id,
      );

      if (isNonNullish(bgCheckValue?.content?.entity)) {
        // skip if this value already has a entity match
        continue;
      }

      const config = bgCheckProperty.options.autoSearchConfig as NonNullable<
        ProfileTypeFieldOptions["BACKGROUND_CHECK"]["autoSearchConfig"]
      >;

      if (
        !this.passesActivationCondition(
          config.activationCondition,
          profileValues.filter((v) => v.type === "SELECT"),
        )
      ) {
        continue;
      }

      await this.triggerBackgroundCheckSearch(
        profile.id,
        bgCheckProperty.id,
        profile.org_id,
        config,
        profileValues,
      );
    }
  }

  private passesActivationCondition(
    activationCondition: ProfileTypeFieldActivationCondition | null | undefined,
    selectValues: ProfileFieldValue[],
  ) {
    if (isNullish(activationCondition)) {
      return true;
    }

    const selectValue = selectValues.find(
      (v) => v.profile_type_field_id === activationCondition.profileTypeFieldId,
    );

    if (selectValue && activationCondition.values.includes(selectValue.content.value)) {
      return true;
    }

    return false;
  }

  private async triggerBackgroundCheckSearch(
    profileId: number,
    profileTypeFieldId: number,
    orgId: number,
    config: NonNullable<ProfileTypeFieldOptions["BACKGROUND_CHECK"]["autoSearchConfig"]>,
    profileValues: ProfileFieldValue[],
  ) {
    const nameValues = config.name.map((nameFieldId) =>
      profileValues.find((v) => v.profile_type_field_id === nameFieldId),
    );

    const dateValue = config.date
      ? profileValues.find((v) => v.profile_type_field_id === config.date)
      : null;

    const countryValue = config.country
      ? profileValues.find((v) => v.profile_type_field_id === config.country)
      : null;

    const birthCountryValue = config.birthCountry
      ? profileValues.find((v) => v.profile_type_field_id === config.birthCountry)
      : null;

    // trigger background check only if all of its configured fields have a value
    // undefined means the field is configured but not replied
    // null means the field is not configured (this is OK)
    if ([...nameValues, dateValue, countryValue, birthCountryValue].every((v) => v !== undefined)) {
      const query = {
        type: config.type,
        name: nameValues.map((v) => v!.content.value).join(" "),
        date: dateValue?.content.value ?? null,
        country: countryValue?.content.value ?? null,
        birthCountry: birthCountryValue?.content.value ?? null,
      } as EntitySearchRequest;

      await this.queues.enqueueMessages("background-check-profile-search", {
        body: {
          orgId,
          profileId,
          profileTypeFieldId,
          query,
        },
      });
    }
  }

  private validateProfileUpdatedReason(
    events: ProfileFieldValueUpdatedEvent[],
    backgroundCheckProperties: ProfileTypeField[],
  ) {
    const configuredProfileTypeFieldIds = unique(
      backgroundCheckProperties.flatMap((p) => {
        const config = p.options.autoSearchConfig as NonNullable<
          ProfileTypeFieldOptions["BACKGROUND_CHECK"]["autoSearchConfig"]
        >;

        return [
          ...config.name,
          config.date,
          config.country,
          config.birthCountry,
          config.activationCondition?.profileTypeFieldId,
        ].filter(isNonNullish);
      }),
    );

    // a background check will trigger on a property if any of the fields configured in autoSearchConfig have been updated
    return events.some(
      (e) =>
        configuredProfileTypeFieldIds.includes(e.data.profile_type_field_id) &&
        e.data.current_profile_field_value_id !== null,
    );
  }
}
