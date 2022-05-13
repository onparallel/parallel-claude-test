import { Knex } from "knex";
import {
  Contact,
  CreateContact,
  CreatePetitionField,
  CreatePetitionPermission,
  CreateUserGroupMember,
  Organization,
  OrganizationUsageLimit,
  OrgIntegration,
  Petition,
  PetitionField,
  PetitionPermission,
  User,
  UserData,
  UserGroup,
  UserGroupMember,
} from "../src/db/__types";
import { deleteAllData } from "../src/util/knexUtils";

export async function seed(knex: Knex): Promise<any> {
  await deleteAllData(knex);

  await knex.raw(/* sql */ `
    insert into feature_flag (name, default_value)
    select unnest(enum_range(NULL::feature_flag_name)) as name, true as default_value
  `);

  const orgs = await knex<Organization>("organization").insert(
    [
      {
        name: "Parallel",
        status: "ROOT",
        usage_details: {
          USER_LIMIT: 100,
          PETITION_SEND: {
            limit: 5000,
            period: "1 month",
          },
          SIGNATURIT_SHARED_APIKEY: {
            limit: 5000,
            period: "1 month",
          },
        },
      },
    ],
    "id"
  );
  const orgIds = orgs.map((o) => o.id);
  const usersInfo = [
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
      cognito_id: "8dd56de4-3b39-4d4b-850c-82be0aba21aa",
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
  ] as (User & UserData)[];

  const usersData = await knex<UserData>("user_data").insert(
    usersInfo.map((u) => ({
      email: u.email,
      cognito_id: u.cognito_id,
      first_name: u.first_name,
      last_name: u.last_name,
    })),
    "*"
  );

  const users = await knex<User>("user").insert(
    usersData.map((ud) => {
      const user = usersInfo.find(({ email }) => email === ud.email)!;
      return {
        user_data_id: ud.id,
        org_id: user.org_id,
        organization_role: user.organization_role,
      };
    }),
    "id"
  );
  const userIds = users.map((u) => u.id);
  await knex<Organization>("organization")
    .where("id", orgIds[0])
    .update({
      created_by: `User:${userIds[0]}`,
      updated_by: `User:${userIds[0]}`,
    });

  await knex<OrganizationUsageLimit>("organization_usage_limit").insert([
    {
      org_id: orgIds[0],
      limit_name: "PETITION_SEND",
      limit: 5000,
      period: "1 month",
      used: 0,
    },
    {
      org_id: orgIds[0],
      limit_name: "SIGNATURIT_SHARED_APIKEY",
      limit: 5000,
      period: "1 month",
      used: 0,
    },
  ]);

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
      first_name: "Alex",
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
      first_name: "Derek",
      last_name: "Lou",
      email: "dereklou00@gmail.com",
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
    },
    {
      org_id: orgIds[0],
      first_name: "Santi",
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

  await knex<OrgIntegration>("org_integration").insert({
    org_id: orgIds[0],
    type: "SIGNATURE",
    provider: "SIGNATURIT",
    name: "Signaturit Sandbox",
    settings: { API_KEY: process.env.SIGNATURIT_SANDBOX_API_KEY, ENVIRONMENT: "sandbox" },
    is_enabled: true,
    created_by: `User:${userIds[0]}`,
    is_default: true,
  });

  const groups = await knex<UserGroup>("user_group").insert(
    [
      {
        org_id: orgIds[0],
        name: "Empty",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`,
      },
      {
        org_id: orgIds[0],
        name: "Dev",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`,
      },
      {
        org_id: orgIds[0],
        name: "All",
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`,
      },
    ],
    "id"
  );

  const userGroupIds = groups.map((g) => g.id);

  const userGroupMembers: CreateUserGroupMember[] = [
    {
      user_group_id: userGroupIds[1],
      user_id: userIds[2],
      created_by: `User:${userIds[2]}`,
    },
    {
      user_group_id: userGroupIds[1],
      user_id: userIds[3],
      created_by: `User:${userIds[2]}`,
    },
    {
      user_group_id: userGroupIds[1],
      user_id: userIds[4],
      created_by: `User:${userIds[2]}`,
    },
    ...userIds.map((userId) => ({
      user_group_id: userGroupIds[2],
      user_id: userId,
      created_by: `User:${userIds[2]}`,
    })),
  ];

  await knex<UserGroupMember>("user_group_member").insert(userGroupMembers);

  const petitions = await knex<Petition>("petition").insert(
    [
      {
        org_id: orgIds[0],
        name: "Tu primer envío con Parallel",
        custom_ref: null,
        locale: "es",
        is_template: true,
        status: null,
        deadline: null,
        email_subject: "Petición de prueba",
        email_body:
          '[{"type":"paragraph","children":[{"text":"Hola "},{"children":[{"text":""}],"placeholder":"contact-first-name","type":"placeholder"},{"text":","}]},{"children":[{"text":""}],"type":"paragraph"},{"children":[{"text":"Este es el mensaje que enviarás a tu destinatario. Muchas de nuestras plantillas vienen con mensajes configurados por defecto como este, con personalización de mensaje para que tú, "},{"children":[{"text":""}],"placeholder":"user-first-name","type":"placeholder"},{"text":", solo tengas que darle a enviar. No obstante, puedes cambiarlo siempre que quieras por tus propias palabras. "}],"type":"paragraph"},{"children":[{"text":""}],"type":"paragraph"},{"children":[{"text":"Un saludo,"}],"type":"paragraph"},{"children":[{"text":"Paco"}],"type":"paragraph"}]',
        created_by: `User:${userIds[2]}`,
        updated_by: `User:${userIds[2]}`,
        reminders_config: null,
        template_description:
          '[{"type":"paragraph","children":[{"text":"Esta plantilla está pensada para facilitarte lo máximo posible tus primeros pasos con Parallel."}]},{"children":[{"text":""}],"type":"paragraph"},{"children":[{"text":"Te recomendamos utilizarla para"},{"bold":true,"text":" realizar un primer envío y enviártela a tu propia dirección de correo"},{"text":" de forma que puedas ver la experiencia que tendrán tus destinatarios."}],"type":"paragraph"},{"children":[{"text":""}],"type":"paragraph"},{"children":[{"text":"El listado de información que aparece abajo, son los campos que luego verás como destinatario. Algunos campos están ocultos, de forma que solo se mostrarán si se cumplen las condiciones."}],"type":"paragraph"}]',
        template_public: true,
        from_template_id: null,
        signature_config: null,
        hide_recipient_view_contents: false,
        skip_forward_security: false,
        public_metadata: `{
        "slug": "first-petition",
        "categories": [
          "legal"
        ],
        "description": null,
        "background_color": "#81E6D9",
        "image_public_file_id": null
      }`,
        from_public_petition_link_id: null,
      },
    ],
    "id"
  );
  const petitionIds = petitions.map((p) => p.id);

  const petitionOwners: CreatePetitionPermission[] = [
    {
      petition_id: petitionIds[0],
      user_id: userIds[2],
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      type: "OWNER",
      is_subscribed: true,
    },
  ];

  await knex<PetitionPermission>("petition_permission").insert(petitionOwners);

  const petitionFieldsPrimerEnvio: CreatePetitionField[] = [
    {
      petition_id: petitionIds[0],
      position: 0,
      type: "HEADING",
      title: "Te presentamos la vista de destinatario",
      description:
        "Esta pantalla, es la que verán tus destinatarios cada vez que les solicites información. Todas las respuestas se guardan y sincronizan automáticamente con tu cuenta de Parallel para que puedas ir revisando la información.",
      optional: true,
      multiple: false,
      options: '{"hasPageBreak":false}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: true,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: false,
    },
    {
      petition_id: petitionIds[0],
      position: 1,
      type: "CHECKBOX",
      title: "¿Qué te gustaría saber ahora?",
      description: null,
      optional: false,
      multiple: false,
      options:
        '{"values":["Quiero ver todos los tipos de campos","Quiero saber cómo veré las respuestas de mis destinatarios","Quiero más información acerca del funcionamiento de Parallel"],"limit":{"type":"EXACT","min":1,"max":1}}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 2,
      type: "HEADING",
      title: "Esto es una Sección",
      description:
        "Permite añadir encabezados y organizar tus preguntas en diferentes secciones. En su configuración, podrás añadir saltos de página también.",
      optional: true,
      multiple: false,
      options: '{"hasPageBreak":false}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 3,
      type: "SHORT_TEXT",
      title: "Esto es un campo de Respuestas cortas",
      description: "Permite al destinatario responder de forma breve. Por ejemplo: nombre, DNI...",
      optional: false,
      multiple: false,
      options: '{"placeholder":null,"maxLength": 100,"format":null}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 4,
      type: "TEXT",
      title: "Esto es un campo de Respuestas largas",
      description:
        "Permite al destinatario escribir todo lo que necesite. Por ejemplo: descripciones, comentarios...",
      optional: false,
      multiple: false,
      options: '{"placeholder":null,"maxLength": 255}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 5,
      type: "FILE_UPLOAD",
      title: "Esto es un campo de Documentos y archivos",
      description: "Permite al destinatario adjuntar todo tipo de archivos.",
      optional: false,
      multiple: true,
      options: '{"accepts":null, "attachToPdf": false}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 6,
      type: "CHECKBOX",
      title: "Esto es un campo de Opciones",
      description:
        "Permite al destinatario escoger entre un listado de opciones. Puedes configurar un límite de respuestas si lo necesitas.",
      optional: false,
      multiple: false,
      options:
        '{"values":["Opción 1","Opción 2","Opción 3"],"limit":{"type":"UNLIMITED","min":1,"max":1}}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 7,
      type: "SELECT",
      title: "Esto es un campo de Desplegable",
      description:
        "Recomendamos utilizar este campo en casos con listados muy extensos, y en casos de listados cortos utilizar un campo de Opciones.",
      optional: false,
      multiple: false,
      options: '{"values":["Opción 1","Opción 2","Opción 3"],"placeholder":null}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 8,
      type: "HEADING",
      title: "Claro, te animamos a que vuelvas a tu cuenta de Parallel y te mostraremos cómo.",
      description:
        "Además, encontrarás todo por escrito en el siguiente enlace: https://help.onparallel.com",
      optional: true,
      multiple: false,
      options: '{"hasPageBreak":false}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 9,
      type: "HEADING",
      title: "Hemos redactado toda la información que necesitas en nuestra Guía de Parallel",
      description: "https://help.onparallel.com",
      optional: true,
      multiple: false,
      options: '{"hasPageBreak":false}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
    {
      petition_id: petitionIds[0],
      position: 10,
      type: "HEADING",
      title: "Si sigues teniendo dudas",
      description:
        "Para cualquier problema o duda que necesites que te resolvamos puedes ponerte en contacto con nosotros a support@onparallel.com. ¡Estaremos encantados de ayudarte!",
      optional: true,
      multiple: false,
      options: '{"hasPageBreak":false}',
      created_by: `User:${userIds[2]}`,
      updated_by: `User:${userIds[2]}`,
      is_fixed: false,
      from_petition_field_id: null,
      alias: null,
      has_comments_enabled: true,
    },
  ];

  await knex<PetitionField>("petition_field").insert([...petitionFieldsPrimerEnvio]);
}
