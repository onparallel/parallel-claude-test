import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        update file_upload set updated_by = 'AnonymizerWorker' where updated_by = 'Worker:Anonymizer';
        update file_upload set deleted_by = 'AnonymizerWorker' where deleted_by = 'Worker:Anonymizer';

        update organization set updated_by = 'OrganizationLimitsWorker' where updated_by = 'Worker:OrganizationLimits';

        update petition set updated_by = 'AnonymizerWorker' where updated_by = 'Worker:Anonymizer';

        update petition_access set updated_by = 'AnonymizerWorker' where updated_by = 'Worker:Anonymizer';
        update petition_access set updated_by = 'EmailEventsWorker' where updated_by = 'Worker:email-events';

        update public_petition_link set updated_by = 'AnonymizerWorker' where updated_by = 'Worker:Anonymizer';

    `);
}

export async function down(knex: Knex): Promise<void> {}
