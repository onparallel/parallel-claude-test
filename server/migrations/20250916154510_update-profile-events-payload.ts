import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    with update_data as (
        select
            pe.id profile_event_id,
            pe.data || jsonb_build_object(
                'profile_relationship_type_id', pr.profile_relationship_type_id,
                'other_side_profile_id', case when pe.profile_id = pr.left_side_profile_id then pr.right_side_profile_id else pr.left_side_profile_id end
            ) as data
        from profile_event pe 
        join profile_relationship pr 
            on pe.type in ('PROFILE_RELATIONSHIP_CREATED', 'PROFILE_RELATIONSHIP_REMOVED') 
            and (pe.data->>'profile_relationship_id')::int = pr.id
    )
    update profile_event
    set data = ud.data
    from update_data ud
    where id = ud.profile_event_id;
`);
}

export async function down(knex: Knex): Promise<void> {}
