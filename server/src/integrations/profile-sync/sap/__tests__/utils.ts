import { Knex } from "knex";
import { fromEntries, groupBy, isNonNullish, map, pipe, values } from "remeda";
import { assert } from "ts-essentials";

export interface ProfileWithValues {
  profile_type_id: number;
  values: Record<string, string | number | string[]>;
}
export async function loadProfiles(knex: Knex, organizationId: number) {
  const { rows: profilesData } = await knex.raw<{
    rows: {
      profile_id: number;
      profile_type_id: number;
      alias: string | null;
      content: { value: string };
    }[];
  }>(
    /* sql */ `
      select pfv.profile_id, pfv.content, p.profile_type_id, ptf.alias from profile p
      join profile_field_value pfv on pfv.profile_id = p.id
      join profile_type_field ptf on ptf.id = pfv.profile_type_field_id
      where 
        p.org_id = ? 
        and p.deleted_at is null 
        and pfv.deleted_at is null and pfv.removed_at is null 
    `,
    [organizationId],
  );

  return pipe(
    profilesData,
    groupBy((r) => r.profile_id),
    values,
    map((r) => ({
      id: r[0].profile_id,
      profile_type_id: r[0].profile_type_id,
      values: fromEntries(
        r.map((r) => {
          assert(isNonNullish(r.alias));
          return [r.alias, r.content.value];
        }),
      ),
    })),
  );
}

export async function expectProfilesAndRelationships(
  knex: Knex,
  organizationId: number,
  profiles: ProfileWithValues[],
  relationships: [
    alias: string,
    [profile_type_id: number, alias: string, value: string],
    [profile_type_id: number, alias: string, value: string],
  ][],
) {
  const dbProfiles = await loadProfiles(knex, organizationId);

  expect(dbProfiles).toEqual(profiles.map((p) => ({ ...p, id: expect.any(Number) })));

  const { rows: relationshipsData } = await knex.raw<{
    rows: { left_side_profile_id: number; right_side_profile_id: number; alias: string }[];
  }>(
    /* sql */ `
      select pr.left_side_profile_id, pr.right_side_profile_id, prt.alias
      from profile_relationship pr
      join profile_relationship_type prt on prt.id = pr.profile_relationship_type_id
      where prt.org_id = ? and pr.deleted_at is null
    `,
    [organizationId],
  );

  expect(relationshipsData).toIncludeSameMembers(
    relationships.map(
      ([
        alias,
        [leftProfileTypeId, leftAlias, leftValue],
        [rightProfileTypeId, rightAlias, rightValue],
      ]) => {
        return {
          left_side_profile_id: dbProfiles.find(
            (r) => r.profile_type_id === leftProfileTypeId && r.values[leftAlias] === leftValue,
          )!.id,
          right_side_profile_id: dbProfiles.find(
            (r) => r.profile_type_id === rightProfileTypeId && r.values[rightAlias] === rightValue,
          )!.id,
          alias,
        };
      },
    ),
  );
}
