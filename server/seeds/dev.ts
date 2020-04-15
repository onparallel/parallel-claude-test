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
  User,
  CreateFileUpload,
  FileUpload,
} from "../src/db/__types";
import { deleteAllData } from "../src/util/knexUtils";
import { random } from "../src/util/token";

export async function seed(knex: Knex): Promise<any> {
  await deleteAllData(knex);
  const orgs: CreateOrganization[] = [
    { name: "Parallel", identifier: "parallel", status: "DEV" },
  ];
  const orgIds = await knex<Organization>("organization").insert(orgs, "id");
  const users: CreateUser[] = [
    {
      org_id: orgIds[0],
      cognito_id: "123e4567-e89b-12d3-a456-426655440000",
      email: "harvey@parallel.so",
      organization_role: "ADMIN",
      first_name: "Harvey",
      last_name: "Specter",
    },
    {
      org_id: orgIds[0],
      cognito_id: "f3a469da-cd92-46de-84d1-cc09b4e57788",
      email: "mike@parallel.so",
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
  ];
  const userIds = await knex<User>("user").insert(users, "id");
  await knex<Organization>("organization")
    .where("id", orgIds[0])
    .update({
      created_by: `User:${userIds[0]}`,
      updated_by: `User:${userIds[0]}`,
    });

  const petitions: CreatePetition[] = [
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      name: "Declaración renta",
      locale: "es",
      status: "PENDING",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      name: "Certificado de retenciones",
      locale: "es",
      status: "PENDING",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      name: "Documentos gotera",
      locale: "es",
      status: "DRAFT",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      name: "Nóminas",
      locale: "es",
      status: "COMPLETED",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
  ];
  const petitionIds = await knex<Petition>("petition").insert(petitions, "id");
  const fields: CreatePetitionField[] = [
    {
      petition_id: petitionIds[0],
      position: 0,
      type: "FILE_UPLOAD",
      title: "Nóminas",
      multiple: true,
      options: {
        accepts: ["PDF", "IMAGE"],
      },
      validated: true,
    },
    {
      petition_id: petitionIds[0],
      position: 1,
      type: "FILE_UPLOAD",
      title: "Algo opcional",
      optional: true,
      multiple: true,
      options: {
        accepts: ["PDF", "IMAGE"],
      },
    },
    {
      petition_id: petitionIds[0],
      position: 2,
      type: "TEXT",
      title: "Nombre completo",
      optional: true,
      multiple: false,
      options: {
        multiline: false,
        placeholder: null,
      },
    },
    {
      petition_id: petitionIds[0],
      position: 3,
      type: "FILE_UPLOAD",
      title: "DNI",
      multiple: true,
      options: {
        accepts: ["PDF", "IMAGE"],
      },
    },
    {
      petition_id: petitionIds[1],
      position: 0,
      type: "FILE_UPLOAD",
      title: "Certificado de retenciones",
      multiple: true,
      options: {
        accepts: ["PDF"],
      },
    },
    {
      petition_id: petitionIds[2],
      position: 0,
      type: "FILE_UPLOAD",
      title: "Certificado de retenciones",
      multiple: true,
      options: {
        accepts: ["PDF"],
      },
    },
    {
      petition_id: petitionIds[3],
      position: 0,
      type: "FILE_UPLOAD",
      title: "Certificado de retenciones",
      multiple: false,
      options: {
        accepts: ["PDF"],
      },
      validated: true,
    },
  ];
  const fieldIds = await knex<PetitionField>("petition_field").insert(
    fields,
    "id"
  );

  const contacts: CreateContact[] = [
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      email: "derek@parallel.so",
      first_name: "Derek",
      last_name: "Lou",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      email: "alex@parallel.so",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      first_name: "Santi",
      email: "santi@parallel.so",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      last_name: "Lou",
      email: "dereklou00@gmail.com",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      owner_id: userIds[2],
      email: "santialbo@gmail.com",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
  ];
  const contactIds = await knex<Contact>("contact").insert(contacts, "id");

  const sendouts: CreatePetitionSendout[] = [
    {
      petition_id: petitionIds[0],
      contact_id: contactIds[0],
      sender_id: userIds[2],
      keycode: random(16),
      locale: petitions[0].locale,
      status: "ACTIVE",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      petition_id: petitionIds[1],
      contact_id: contactIds[1],
      sender_id: userIds[2],
      keycode: random(16),
      locale: petitions[1].locale,
      status: "ACTIVE",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      petition_id: petitionIds[3],
      contact_id: contactIds[1],
      sender_id: userIds[2],
      keycode: random(16),
      locale: petitions[3].locale,
      status: "ACTIVE",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
  ];
  const sendoutIds = await knex<PetitionSendout>("petition_sendout").insert(
    sendouts,
    "id"
  );

  const fileUploads: CreateFileUpload[] = [
    {
      path: `${random(16)}/nomina.pdf`,
      filename: "nomina.pdf",
      size: 123031,
      content_type: "application/pdf",
      created_by: `Contact:${contactIds[0]}`,
      updated_by: `Contact:${contactIds[0]}`,
    },
    {
      path: `${random(16)}/dni.jpeg`,
      filename: "dni.jpeg",
      size: 1928824,
      content_type: "image/jpeg",
      created_by: `Contact:${contactIds[0]}`,
      updated_by: `Contact:${contactIds[0]}`,
    },
    {
      path: `${random(16)}/archivo.pdf`,
      filename: "archivo.pdf",
      size: 994,
      content_type: "application/pdf",
      created_by: `Contact:${contactIds[0]}`,
      updated_by: `Contact:${contactIds[0]}`,
    },
  ];

  const fileUploadIds = await knex<FileUpload>("file_upload").insert(
    fileUploads,
    "id"
  );

  const replies: CreatePetitionFieldReply[] = [
    {
      petition_field_id: fieldIds[0],
      petition_sendout_id: sendoutIds[0],
      type: "FILE_UPLOAD",
      content: { file_upload_id: fileUploadIds[0] },
      created_by: `Contact:${contactIds[0]}`,
      updated_by: `Contact:${contactIds[0]}`,
    },
    {
      petition_field_id: fieldIds[2],
      petition_sendout_id: sendoutIds[0],
      type: "TEXT",
      content: { text: "Santiago Albo Guijarro" },
      created_by: `Contact:${contactIds[0]}`,
      updated_by: `Contact:${contactIds[0]}`,
    },
    {
      petition_field_id: fieldIds[3],
      petition_sendout_id: sendoutIds[0],
      type: "FILE_UPLOAD",
      content: { file_upload_id: fileUploadIds[1] },
      created_by: `Contact:${contactIds[0]}`,
      updated_by: `Contact:${contactIds[0]}`,
    },
    {
      petition_field_id: fieldIds[6],
      petition_sendout_id: sendoutIds[0],
      type: "FILE_UPLOAD",
      content: { file_upload_id: fileUploadIds[2] },
      created_by: `Contact:${contactIds[1]}`,
      updated_by: `Contact:${contactIds[1]}`,
    },
  ];
  const replyIds = await knex<PetitionFieldReply>(
    "petition_field_reply"
  ).insert(replies);
}
