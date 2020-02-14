import * as Knex from "knex";
import {
  Organization,
  User,
  CreateUser,
  CreateOrganization
} from "../src/db/__types";

export async function seed(knex: Knex): Promise<any> {
  await knex("user").delete();
  await knex("organization").delete();
  const organizations: CreateOrganization[] = [
    { name: "Parallel", identifier: "parallel", status: "DEV" }
  ];
  const [orgId] = await knex<Organization>("organization").insert(
    organizations,
    "id"
  );
  const users: CreateUser[] = [
    {
      org_id: orgId,
      cognito_id: "123e4567-e89b-12d3-a456-426655440000",
      email: "test@parallel.so",
      organization_role: "ADMIN",
      first_name: "Harvey",
      last_name: "Specter"
    },
    {
      org_id: orgId,
      cognito_id: "f3a469da-cd92-46de-84d1-cc09b4e57788",
      email: "mike@parallel.so",
      organization_role: "NORMAL",
      first_name: "Mike",
      last_name: "Ross"
    },
    {
      org_id: orgId,
      cognito_id: "bd82c5a1-5622-41a5-9116-1686a44cf3fa",
      email: "santialbo@gmail.com",
      organization_role: "ADMIN",
      first_name: "Santi",
      last_name: "Albo"
    }
  ];
  const [userId] = await knex<User>("user").insert(users, "id");
  await knex<Organization>("organization")
    .where("id", orgId)
    .update({
      created_by: `User:${userId}`,
      updated_by: `User:${userId}`
    });
}
