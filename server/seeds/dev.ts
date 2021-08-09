import { Knex } from "knex";
import {
  Contact,
  CreateContact,
  CreateOrganization,
  CreateUser,
  Organization,
  User,
} from "../src/db/__types";
import { deleteAllData } from "../src/util/knexUtils";

export async function seed(knex: Knex): Promise<any> {
  await deleteAllData(knex);
  const orgs: CreateOrganization[] = [{ name: "Parallel", identifier: "parallel", status: "DEV" }];
  const orgIds = await knex<Organization>("organization").insert(orgs, "id");
  const users: CreateUser[] = [
    {
      org_id: orgIds[0],
      cognito_id: "123e4567-e89b-12d3-a456-426655440000",
      email: "harvey@onparallel.com",
      organization_role: "OWNER",
      first_name: "Harvey",
      last_name: "Specter",
    },
    {
      org_id: orgIds[0],
      cognito_id: "f3a469da-cd92-46de-84d1-cc09b4e57788",
      email: "mike@onparallel.com",
      organization_role: "NORMAL",
      first_name: "Mike",
      last_name: "Ross",
    },
    {
      org_id: orgIds[0],
      cognito_id: "bd82c5a1-5622-41a5-9116-1686a44cf3fa",
      email: "santialbo@gmail.com",
      organization_role: "ADMIN",
      first_name: "Santi",
      last_name: "Albo",
    },
    {
      org_id: orgIds[0],
      cognito_id: "3f3f3d5b-5e83-45f0-8c5f-36e4360eb704",
      email: "mariano@onparallel.com",
      organization_role: "ADMIN",
      first_name: "Mariano",
      last_name: "Rodriguez",
    },
    {
      org_id: orgIds[0],
      cognito_id: "013f5bce-5459-4e7c-bc64-773a4ffcd084",
      email: "konstantin@onparallel.com",
      organization_role: "ADMIN",
      first_name: "Konstantin",
      last_name: "Klykov",
    },
  ];
  const userIds = await knex<User>("user").insert(users, "id");
  await knex<Organization>("organization")
    .where("id", orgIds[0])
    .update({
      created_by: `User:${userIds[0]}`,
      updated_by: `User:${userIds[0]}`,
    });

  const contacts: CreateContact[] = [
    {
      org_id: orgIds[0],
      email: "derek@onparallel.com",
      first_name: "Derek",
      last_name: "Lou",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      email: "alex@onparallel.com",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      first_name: "Santi",
      email: "santi@onparallel.com",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      last_name: "Lou",
      email: "dereklou00@gmail.com",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      email: "santialbo@gmail.com",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      first_name: "konstantin",
      last_name: "Klykov",
      email: "konstantin@onparallel.com",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
  ];
  await knex<Contact>("contact").insert(contacts, "id");
}
