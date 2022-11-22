# TO ARCHIVE OLD MIGRATIONS

- On the server folder, run `yarn archive-migrations`. This will generate a schema-only dump from your local database and paste it on a new knex migration file. Old migrations will be moved to archived/YYYMMDDHHmmss. Your database will NOT be altered.
  
- After this, run `yarn sync-migrations`. Your migrations table on database will be updated will all migration files found on this folder.

If somebody else commits a migrations archive, run `yarn sync-migrations` to update your local database "migrations" table with recent changes.