import * as Knex from "knex";
import {
  Contact,
  CreateContact,
  CreateOrganization,
  CreatePetition,
  CreatePetitionSendout,
  CreatePetitionField,
  CreatePetitionFieldReply,
  CreateUser,
  Organization,
  Petition,
  PetitionSendout,
  PetitionField,
  PetitionFieldReply,
  User
} from "../src/db/__types";
import { deleteAllData } from "../src/util/knexUtils";
import { random } from "../src/util/token";

export async function seed(knex: Knex): Promise<any> {
  await deleteAllData(knex);
  const orgIds = await knex<Organization>("organization").insert(
    <CreateOrganization[]>[
      { name: "Parallel", identifier: "parallel", status: "DEV" }
    ],
    "id"
  );
  const userIds = await knex<User>("user").insert(
    <CreateUser[]>[
      {
        org_id: orgIds[0],
        cognito_id: "123e4567-e89b-12d3-a456-426655440000",
        email: "harvey@parallel.so",
        organization_role: "ADMIN",
        first_name: "Harvey",
        last_name: "Specter"
      },
      {
        org_id: orgIds[0],
        cognito_id: "f3a469da-cd92-46de-84d1-cc09b4e57788",
        email: "mike@parallel.so",
        organization_role: "NORMAL",
        first_name: "Mike",
        last_name: "Ross"
      },
      {
        org_id: orgIds[0],
        cognito_id: "bd82c5a1-5622-41a5-9116-1686a44cf3fa",
        email: "santialbo@gmail.com",
        organization_role: "ADMIN",
        first_name: "Santi",
        last_name: "Albo"
      }
    ],
    "id"
  );
  await knex<Organization>("organization")
    .where("id", orgIds[0])
    .update({
      created_by: `User:${userIds[0]}`,
      updated_by: `User:${userIds[0]}`
    });
  const petitionIds = await knex<Petition>("petition").insert(
    <CreatePetition[]>[
      {
        org_id: orgIds[0],
        owner_id: userIds[2],
        name: "Declaración renta",
        locale: "es",
        status: "PENDING",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      },
      {
        org_id: orgIds[0],
        owner_id: userIds[2],
        name: "Certificado de retenciones",
        locale: "es",
        status: "PENDING",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      },
      {
        org_id: orgIds[0],
        owner_id: userIds[2],
        name: "Documentos gotera",
        locale: "es",
        status: "DRAFT",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      },
      {
        org_id: orgIds[0],
        owner_id: userIds[2],
        name: "Nóminas",
        locale: "es",
        status: "COMPLETED",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      }
    ],
    "id"
  );
  const fieldIds = await knex<PetitionField>("petition_field").insert(
    <CreatePetitionField[]>[
      {
        petition_id: petitionIds[0],
        position: 0,
        type: "FILE_UPLOAD",
        title: "Nóminas",
        options: {
          accepts: ["PDF", "IMAGE"],
          multiple: true
        },
        validated: true
      },
      {
        petition_id: petitionIds[0],
        position: 1,
        type: "FILE_UPLOAD",
        title: "Algo opcional",
        optional: true,
        options: {
          accepts: ["PDF", "IMAGE"],
          multiple: false
        }
      },
      {
        petition_id: petitionIds[0],
        position: 2,
        type: "FILE_UPLOAD",
        title: "Algo opcional y múltiple",
        optional: true,
        options: {
          accepts: ["PDF", "IMAGE"],
          multiple: true
        }
      },
      {
        petition_id: petitionIds[0],
        position: 3,
        type: "FILE_UPLOAD",
        title: "DNI",
        options: {
          accepts: ["PDF", "IMAGE"],
          multiple: false
        }
      },
      {
        petition_id: petitionIds[1],
        position: 0,
        type: "FILE_UPLOAD",
        title: "Certificado de retenciones",
        options: {
          accepts: ["PDF"],
          multiple: false
        }
      },
      {
        petition_id: petitionIds[2],
        position: 0,
        type: "FILE_UPLOAD",
        title: "Certificado de retenciones",
        options: {
          accepts: ["PDF"],
          multiple: false
        }
      },
      {
        petition_id: petitionIds[3],
        position: 0,
        type: "FILE_UPLOAD",
        title: "Certificado de retenciones",
        options: {
          accepts: ["PDF"],
          multiple: false
        },
        validated: true
      }
    ],
    "id"
  );

  const contactIds = await knex<Contact>("contact").insert(
    <CreateContact[]>[
      {
        org_id: orgIds[0],
        owner_id: userIds[2],
        email: "derek@parallel.so",
        first_name: "Derek",
        last_name: "Lou",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      },
      {
        org_id: orgIds[0],
        owner_id: userIds[2],
        email: "alex@parallel.so",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      }
    ],
    "id"
  );

  const sendoutIds = await knex<PetitionSendout>("petition_sendout").insert(
    <CreatePetitionSendout[]>[
      {
        petition_id: petitionIds[0],
        contact_id: contactIds[0],
        keycode: random(16),
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      },
      {
        petition_id: petitionIds[1],
        contact_id: contactIds[1],
        keycode: random(16),
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      },
      {
        petition_id: petitionIds[3],
        contact_id: contactIds[1],
        keycode: random(16),
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`
      }
    ],
    "id"
  );

  const replyIds = await knex<PetitionFieldReply>(
    "petition_field_reply"
  ).insert(<CreatePetitionFieldReply[]>[
    {
      petition_field_id: fieldIds[0],
      petition_sendout_id: sendoutIds[0],
      content: {},
      created_by: `Contact:${contactIds[0]}`,
      updated_by: `Contact:${contactIds[0]}`
    },
    {
      petition_field_id: fieldIds[2],
      petition_sendout_id: sendoutIds[0],
      content: {},
      created_by: `Contact:${contactIds[0]}`,
      updated_by: `Contact:${contactIds[0]}`
    },
    {
      petition_field_id: fieldIds[6],
      petition_sendout_id: sendoutIds[0],
      content: {},
      created_by: `Contact:${contactIds[1]}`,
      updated_by: `Contact:${contactIds[1]}`
    }
  ]);
}
