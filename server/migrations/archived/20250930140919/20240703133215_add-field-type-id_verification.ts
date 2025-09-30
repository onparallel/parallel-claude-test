import type { Knex } from "knex";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "ID_VERIFICATION");
  await addIntegrationType(knex, "ID_VERIFICATION");
  await addTaskName(knex, "ID_VERIFICATION_SESSION_COMPLETED");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table petition_field 
    drop constraint petition_field__profile_type_id__field_group; 

    alter table petition_field_reply
    drop constraint petition_field_reply__associated_profile_id__field_group;

    drop index org_integration___sso_email_domains__index;
    drop index org_integration___user_provisioning_auth_key__index;
  `);

  await removeFieldType(knex, "ID_VERIFICATION");
  await removeIntegrationType(knex, "ID_VERIFICATION");
  await removeTaskName(knex, "ID_VERIFICATION_SESSION_COMPLETED");

  await knex.raw(/* sql */ `
    alter table petition_field 
    add constraint petition_field__profile_type_id__field_group 
    check (((profile_type_id is null) or ((profile_type_id is not null) and (type = 'FIELD_GROUP'::petition_field_type))));

    alter table petition_field_reply
    add constraint petition_field_reply__associated_profile_id__field_group
    check (((associated_profile_id is null) or ((associated_profile_id is not null) and (type = 'FIELD_GROUP'::petition_field_type))));

    CREATE INDEX org_integration___sso_email_domains__index ON org_integration USING gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) WHERE (type = 'SSO'::integration_type);
    CREATE INDEX org_integration___user_provisioning_auth_key__index ON org_integration USING btree (((settings ->> 'AUTH_KEY'::text))) WHERE (type = 'USER_PROVISIONING'::integration_type);
  `);
}
