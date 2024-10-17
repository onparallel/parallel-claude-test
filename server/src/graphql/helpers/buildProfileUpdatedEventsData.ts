import { indexBy, isNonNullish } from "remeda";
import { ProfileFieldValue, User } from "../../db/__types";
import {
  ProfileFieldExpiryUpdatedEvent,
  ProfileFieldValueUpdatedEvent,
} from "../../db/events/ProfileEvent";

export function buildProfileUpdatedEventsData(
  profileId: number,
  fields: { profileTypeFieldId: number; expiryDate?: string | null; alias: string | null }[],
  currentValues: ProfileFieldValue[],
  previousValues: ProfileFieldValue[],
  user: User,
  externalSourceIntegrationId?: number | null,
) {
  const currentByPtfId = indexBy(currentValues, (v) => v.profile_type_field_id);
  const previousByPtfId = indexBy(previousValues, (v) => v.profile_type_field_id);

  return fields.flatMap((f) => {
    const current = currentByPtfId[f.profileTypeFieldId] as ProfileFieldValue | undefined;
    const previous = previousByPtfId[f.profileTypeFieldId] as ProfileFieldValue | undefined;
    const expiryChanged =
      f.expiryDate !== undefined &&
      (previous?.expiry_date?.valueOf() ?? null) !== (f.expiryDate?.valueOf() ?? null);
    return [
      ...(isNonNullish(current) || isNonNullish(previous)
        ? [
            {
              org_id: user.org_id,
              profile_id: profileId,
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                user_id: user.id,
                profile_type_field_id: f.profileTypeFieldId,
                current_profile_field_value_id: current?.id ?? null,
                previous_profile_field_value_id: previous?.id ?? null,
                alias: f.alias ?? null,
                external_source_integration_id: externalSourceIntegrationId ?? null,
              },
            } satisfies ProfileFieldValueUpdatedEvent<true>,
          ]
        : []),
      ...(expiryChanged
        ? [
            {
              org_id: user.org_id,
              profile_id: profileId,
              type: "PROFILE_FIELD_EXPIRY_UPDATED",
              data: {
                user_id: user.id,
                profile_type_field_id: f.profileTypeFieldId,
                expiry_date: current?.expiry_date ?? null,
                alias: f.alias ?? null,
              },
            } satisfies ProfileFieldExpiryUpdatedEvent<true>,
          ]
        : []),
    ];
  });
}
