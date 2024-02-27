import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { Knex } from "knex";
import pMap from "p-map";
import { User, UserData, UserGroupPermissionName } from "../src/db/__types";
import { EncryptionService } from "../src/services/EncryptionService";
import { defaultBrandTheme } from "../src/util/BrandTheme";
import { defaultPdfDocumentTheme } from "../src/util/PdfDocumentTheme";
import { deleteAllData } from "../src/util/knexUtils";
import { loadEnv } from "../src/util/loadEnv";

const PERMISSIONS = {
  ADMIN: [
    "REPORTS:OVERVIEW",
    "REPORTS:TEMPLATE_STATISTICS",
    "REPORTS:TEMPLATE_REPLIES",
    "TAGS:UPDATE_TAGS",
    "TAGS:DELETE_TAGS",
    "PROFILES:DELETE_PROFILES",
    "PROFILES:DELETE_PERMANENTLY_PROFILES",
    "PROFILE_TYPES:CRUD_PROFILE_TYPES",
    "INTEGRATIONS:CRUD_INTEGRATIONS",
    "USERS:CRUD_USERS",
    "USERS:GHOST_LOGIN",
    "TEAMS:CRUD_TEAMS",
    "TEAMS:READ_PERMISSIONS",
    "TEAMS:UPDATE_PERMISSIONS",
    "ORG_SETTINGS",
    "CONTACTS:DELETE_CONTACTS",
    "PETITIONS:SEND_ON_BEHALF",
  ],
  NORMAL: [
    "PETITIONS:CHANGE_PATH",
    "PETITIONS:CREATE_TEMPLATES",
    "PETITIONS:LIST_PUBLIC_TEMPLATES",
    "INTEGRATIONS:CRUD_API",
    "PROFILES:SUBSCRIBE_PROFILES",
    "TAGS:CREATE_TAGS",
  ],
  COLLABORATOR: [
    "PETITIONS:CREATE_PETITIONS",
    "PROFILES:CREATE_PROFILES",
    "PROFILES:CLOSE_PROFILES",
    "PROFILES:LIST_PROFILES",
    "PROFILE_ALERTS:LIST_ALERTS",
    "CONTACTS:LIST_CONTACTS",
    "USERS:LIST_USERS",
    "TEAMS:LIST_TEAMS",
  ],
};

export async function seed(knex: Knex): Promise<any> {
  await loadEnv();
  await deleteAllData(knex);

  const encryption = new EncryptionService({
    security: { encryptKeyBase64: process.env.SECURITY_ENCRYPTION_KEY_BASE64!, jwtSecret: "" },
  });

  await knex.raw(/* sql */ `
    insert into feature_flag (name, default_value)
    select unnest(enum_range(NULL::feature_flag_name)) as name, true as default_value
  `);

  const orgs = await knex("organization").insert(
    [
      {
        name: "Parallel",
        status: "ROOT",
        usage_details: {
          USER_LIMIT: 100,
          PETITION_SEND: {
            limit: 5000,
            duration: { months: 1 },
          },
          SIGNATURIT_SHARED_APIKEY: {
            limit: 5000,
            duration: { months: 1 },
          },
        },
      },
      {
        name: "Parallel e2e",
        status: "DEV",
        usage_details: {
          USER_LIMIT: 100,
          PETITION_SEND: {
            limit: 5000,
            duration: { months: 1 },
          },
          SIGNATURIT_SHARED_APIKEY: {
            limit: 5000,
            duration: { months: 1 },
          },
        },
      },
    ],
    "id",
  );

  const orgIds = orgs.map((o) => o.id);

  const usersInfo = [
    {
      org_id: orgIds[0],
      cognito_id: "123e4567-e89b-12d3-a456-426655440000",
      email: "harvey@onparallel.com",
      is_org_owner: true,
      first_name: "Harvey",
      last_name: "Specter",
      preferred_locale: "en",
    },
    {
      org_id: orgIds[0],
      cognito_id: "f3a469da-cd92-46de-84d1-cc09b4e57788",
      email: "mike@onparallel.com",
      is_org_owner: false,
      first_name: "Mike",
      last_name: "Ross",
      preferred_locale: "en",
    },
    {
      org_id: orgIds[0],
      cognito_id: "bd82c5a1-5622-41a5-9116-1686a44cf3fa",
      email: "santialbo@gmail.com",
      is_org_owner: false,
      first_name: "Santi",
      last_name: "Albo",
      preferred_locale: "en",
    },
    {
      org_id: orgIds[0],
      cognito_id: "8dd56de4-3b39-4d4b-850c-82be0aba21aa",
      email: "mariano@onparallel.com",
      is_org_owner: false,
      first_name: "Mariano",
      last_name: "Rodriguez",
      preferred_locale: "en",
    },
    {
      org_id: orgIds[0],
      cognito_id: "013f5bce-5459-4e7c-bc64-773a4ffcd084",
      email: "konstantin@onparallel.com",
      is_org_owner: false,
      first_name: "Konstantin",
      last_name: "Klykov",
      preferred_locale: "en",
    },
    {
      org_id: orgIds[1],
      cognito_id: "f962bef6-e1f5-4937-ad37-472e8dd96927",
      email: "parallele2euser1+user1@gmail.com",
      is_org_owner: true,
      first_name: "User",
      last_name: "1",
      preferred_locale: "en",
    },
    {
      org_id: orgIds[1],
      cognito_id: "fd1ab908-4270-42a8-ad32-a8e67f71f6e4",
      email: "parallele2euser1+user2@gmail.com",
      is_org_owner: false,
      first_name: "User",
      last_name: "2",
      preferred_locale: "en",
    },
  ] as (User & UserData)[];

  const usersData = await knex("user_data").insert(
    usersInfo.map((u) => ({
      email: u.email,
      cognito_id: u.cognito_id,
      first_name: u.first_name,
      last_name: u.last_name,
      preferred_locale: u.preferred_locale,
    })),
    "*",
  );

  const users = (
    await knex("user").insert(
      usersData.map((ud) => {
        const user = usersInfo.find(({ email }) => email === ud.email)!;
        return {
          user_data_id: ud.id,
          org_id: user.org_id,
          is_org_owner: user.is_org_owner,
        };
      }),
      ["id", "org_id", "is_org_owner", "user_data_id"],
    )
  ).map((u) => ({
    ...u,
    role: [
      "santialbo@gmail.com",
      "mariano@onparallel.com",
      "konstantin@onparallel.com",
      "parallele2euser1+user2@gmail.com",
    ].includes(usersData.find((ud) => ud.id === u.user_data_id)!.email)
      ? "ADMIN"
      : u.is_org_owner
        ? "OWNER"
        : "NORMAL",
  }));

  const orgUsers = orgIds.map((id) => [id, users.filter((u) => u.org_id === id)] as const);

  await pMap(
    orgUsers,
    async ([orgId, users], i) => {
      const ownerId = users.find((u) => u.is_org_owner)!.id;
      await knex("organization")
        .where("id", orgId)
        .update({
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
        });
      await knex("organization_usage_limit").insert([
        {
          org_id: orgId,
          limit_name: "PETITION_SEND",
          limit: 5000,
          period: "P1M" as any,
          used: 0,
        },
        {
          org_id: orgId,
          limit_name: "SIGNATURIT_SHARED_APIKEY",
          limit: 5000,
          period: "P1M" as any,
          used: 0,
        },
      ]);
      await knex("org_integration").insert([
        {
          org_id: orgId,
          type: "SIGNATURE",
          provider: "SIGNATURIT",
          name: "Signaturit Sandbox",
          settings: {
            CREDENTIALS: encryption.encrypt(
              JSON.stringify({ API_KEY: process.env.SIGNATURIT_SANDBOX_API_KEY }),
              "hex",
            ),
            ENVIRONMENT: "sandbox",
            IS_PARALLEL_MANAGED: false,
          },
          is_enabled: true,
          created_by: `User:${ownerId}`,
          is_default: true,
        },
      ]);

      const [allUsersGroup, adminsGroup] = await knex("user_group").insert(
        [
          {
            org_id: orgId,
            name: "",
            localizable_name: { es: "Todos los usuarios", en: "All users" },
            type: "ALL_USERS",
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          },
          {
            org_id: orgId,
            name: "Admins",
            type: "INITIAL",
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          },
          {
            org_id: orgId,
            name: "Empty",
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          },
        ],
        "id",
      );

      // ALL_USERS members
      await knex("user_group_member").insert(
        users.map((u) => ({
          user_group_id: allUsersGroup.id,
          user_id: u.id,
          created_by: `User:${ownerId}`,
        })),
      );

      // ALL_USERS permissions
      await knex("user_group_permission").insert(
        [...PERMISSIONS.NORMAL, ...PERMISSIONS.COLLABORATOR].map((name) => ({
          user_group_id: allUsersGroup.id,
          effect: "GRANT",
          name: name as UserGroupPermissionName,
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
        })),
      );

      // Admins members
      await knex("user_group_member").insert(
        users
          .filter((u) => u.role === "ADMIN")
          .map((u) => ({
            user_group_id: adminsGroup.id,
            user_id: u.id,
            created_by: `User:${ownerId}`,
          })),
      );

      // Admins permissions
      await knex("user_group_permission").insert(
        [...PERMISSIONS.ADMIN, ...PERMISSIONS.NORMAL, ...PERMISSIONS.COLLABORATOR].map((name) => ({
          user_group_id: adminsGroup.id,
          effect: "GRANT",
          name: name as UserGroupPermissionName,
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
        })),
      );

      const orgThemes = await knex("organization_theme").insert(
        [
          {
            org_id: orgId,
            name: "Default theme",
            type: "PDF_DOCUMENT",
            is_default: true,
            data: defaultPdfDocumentTheme,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          },
          {
            org_id: orgId,
            type: "BRAND",
            name: "Default",
            is_default: true,
            data: defaultBrandTheme,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          },
        ],
        "id",
      );

      const petitions = await knex("petition").insert(
        [
          {
            org_id: orgId,
            name: "Empty template",
            custom_ref: null,
            recipient_locale: "en",
            is_template: true,
            status: null,
            deadline: null,
            email_subject: null,
            email_body: null,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
            reminders_config: null,
            template_description: null,
            template_public: i === 0,
            from_template_id: null,
            signature_config: null,
            hide_recipient_view_contents: false,
            skip_forward_security: false,
            public_metadata: null,
            from_public_petition_link_id: null,
            document_organization_theme_id: orgThemes[0].id,
          },
          {
            org_id: orgId,
            name: "Tu primer envío con Parallel",
            custom_ref: null,
            recipient_locale: "es",
            is_template: true,
            status: null,
            deadline: null,
            email_subject: "Petición de prueba",
            email_body:
              '[{"type":"paragraph","children":[{"text":"Hola "},{"children":[{"text":""}],"placeholder":"contact-first-name","type":"placeholder"},{"text":","}]},{"children":[{"text":""}],"type":"paragraph"},{"children":[{"text":"Este es el mensaje que enviarás a tu destinatario. Muchas de nuestras plantillas vienen con mensajes configurados por defecto como este, con personalización de mensaje para que tú, "},{"children":[{"text":""}],"placeholder":"user-first-name","type":"placeholder"},{"text":", solo tengas que darle a enviar. No obstante, puedes cambiarlo siempre que quieras por tus propias palabras. "}],"type":"paragraph"},{"children":[{"text":""}],"type":"paragraph"},{"children":[{"text":"Un saludo,"}],"type":"paragraph"},{"children":[{"text":"Paco"}],"type":"paragraph"}]',
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
            reminders_config: null,
            template_description:
              '[{"type":"paragraph","children":[{"text":"Esta plantilla está pensada para facilitarte lo máximo posible tus primeros pasos con Parallel."}]},{"children":[{"text":""}],"type":"paragraph"},{"children":[{"text":"Te recomendamos utilizarla para"},{"bold":true,"text":" realizar un primer envío y enviártela a tu propia dirección de correo"},{"text":" de forma que puedas ver la experiencia que tendrán tus destinatarios."}],"type":"paragraph"},{"children":[{"text":""}],"type":"paragraph"},{"children":[{"text":"El listado de información que aparece abajo, son los campos que luego verás como destinatario. Algunos campos están ocultos, de forma que solo se mostrarán si se cumplen las condiciones."}],"type":"paragraph"}]',
            template_public: i === 0,
            from_template_id: null,
            signature_config: null,
            hide_recipient_view_contents: false,
            skip_forward_security: false,
            public_metadata:
              i === 0
                ? JSON.stringify({
                    slug: "first-petition",
                    categories: ["legal"],
                    description: null,
                    background_color: "#81E6D9",
                    image_public_file_id: null,
                  })
                : null,
            from_public_petition_link_id: null,
            document_organization_theme_id: orgThemes[0].id,
          },
        ],
        "id",
      );

      await knex("petition_permission").insert(
        petitions.flatMap((p) =>
          users.map((u) => ({
            petition_id: p.id,
            user_id: u.id,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
            type: u.role === "OWNER" ? "OWNER" : "WRITE",
            is_subscribed: true,
          })),
        ),
      );

      await knex("petition_field").insert([
        {
          petition_id: petitions[0].id,
          position: 0,
          type: "HEADING",
          title: "",
          description: "",
          options: '{"hasPageBreak":false}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: true,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: false,
        },
        {
          petition_id: petitions[1].id,
          position: 0,
          type: "HEADING",
          title: "Te presentamos la vista de destinatario",
          description:
            "Esta pantalla, es la que verán tus destinatarios cada vez que les solicites información. Todas las respuestas se guardan y sincronizan automáticamente con tu cuenta de Parallel para que puedas ir revisando la información.",
          optional: true,
          multiple: false,
          options: '{"hasPageBreak":false}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: true,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: false,
        },
        {
          petition_id: petitions[1].id,
          position: 1,
          type: "CHECKBOX",
          title: "¿Qué te gustaría saber ahora?",
          description: null,
          optional: false,
          multiple: false,
          options:
            '{"values":["Quiero ver todos los tipos de campos","Quiero saber cómo veré las respuestas de mis destinatarios","Quiero más información acerca del funcionamiento de Parallel"],"limit":{"type":"EXACT","min":1,"max":1}}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 2,
          type: "HEADING",
          title: "Esto es una Sección",
          description:
            "Permite añadir encabezados y organizar tus preguntas en diferentes secciones. En su configuración, podrás añadir saltos de página también.",
          optional: true,
          multiple: false,
          options: '{"hasPageBreak":false}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 3,
          type: "SHORT_TEXT",
          title: "Esto es un campo de Respuestas cortas",
          description:
            "Permite al destinatario responder de forma breve. Por ejemplo: nombre, DNI...",
          optional: false,
          multiple: false,
          options: '{"placeholder":null,"maxLength": 100,"format":null}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 4,
          type: "TEXT",
          title: "Esto es un campo de Respuestas largas",
          description:
            "Permite al destinatario escribir todo lo que necesite. Por ejemplo: descripciones, comentarios...",
          optional: false,
          multiple: false,
          options: '{"placeholder":null,"maxLength": 255}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 5,
          type: "FILE_UPLOAD",
          title: "Esto es un campo de Documentos y archivos",
          description: "Permite al destinatario adjuntar todo tipo de archivos.",
          optional: false,
          multiple: true,
          options: '{"accepts":null, "attachToPdf": false}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 6,
          type: "CHECKBOX",
          title: "Esto es un campo de Opciones",
          description:
            "Permite al destinatario escoger entre un listado de opciones. Puedes configurar un límite de respuestas si lo necesitas.",
          optional: false,
          multiple: false,
          options:
            '{"values":["Opción 1","Opción 2","Opción 3"],"limit":{"type":"UNLIMITED","min":1,"max":1}}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 7,
          type: "SELECT",
          title: "Esto es un campo de Desplegable",
          description:
            "Recomendamos utilizar este campo en casos con listados muy extensos, y en casos de listados cortos utilizar un campo de Opciones.",
          optional: false,
          multiple: false,
          options: '{"values":["Opción 1","Opción 2","Opción 3"],"placeholder":null}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 8,
          type: "HEADING",
          title: "Claro, te animamos a que vuelvas a tu cuenta de Parallel y te mostraremos cómo.",
          description:
            "Además, encontrarás todo por escrito en el siguiente enlace: https://help.onparallel.com",
          optional: true,
          multiple: false,
          options: '{"hasPageBreak":false}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 9,
          type: "HEADING",
          title: "Hemos redactado toda la información que necesitas en nuestra Guía de Parallel",
          description: "https://help.onparallel.com",
          optional: true,
          multiple: false,
          options: '{"hasPageBreak":false}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
        {
          petition_id: petitions[1].id,
          position: 10,
          type: "HEADING",
          title: "Si sigues teniendo dudas",
          description:
            "Para cualquier problema o duda que necesites que te resolvamos puedes ponerte en contacto con nosotros a support@onparallel.com. ¡Estaremos encantados de ayudarte!",
          optional: true,
          multiple: false,
          options: '{"hasPageBreak":false}',
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
          is_fixed: false,
          from_petition_field_id: null,
          alias: null,
          has_comments_enabled: true,
        },
      ]);

      // profile types
      await knex.transaction(async (t) => {
        const [individual, legalEntity, contract] = await t.from("profile_type").insert(
          [
            { name: { en: "Individual", es: "Persona física" } },
            { name: { en: "Legal entity", es: "Persona jurídica" } },
            { name: { en: "Contract", es: "Contrato" } },
          ].map((data) => ({
            ...data,
            org_id: orgId,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          })),
          "*",
        );

        const [firstName, lastName] = await t.from("profile_type_field").insert(
          [
            {
              type: "SHORT_TEXT" as const,
              name: { en: "First name", es: "Nombre" },
              alias: "FIRST_NAME",
            },
            {
              type: "SHORT_TEXT" as const,
              name: { en: "Last name", es: "Apellido" },
              alias: "LAST_NAME",
            },
            {
              type: "FILE" as const,
              name: { en: "ID", es: "Documento de identificación" },
              is_expirable: true,
              expiry_alert_ahead_time: knex.raw(`make_interval(months => ?)`, [1]),
              alias: "ID",
            },
            {
              type: "DATE" as const,
              name: { en: "Date of birth", es: "Fecha de nacimiento" },
              alias: "DATE_OF_BIRTH",
              options: knex.raw("?::jsonb", JSON.stringify({ useReplyAsExpiryDate: false })),
            },
            {
              type: "PHONE" as const,
              name: { en: "Phone number", es: "Número de teléfono" },
              alias: "PHONE_NUMBER",
            },
            {
              type: "TEXT" as const,
              name: { en: "Address", es: "Dirección" },
              alias: "ADDRESS",
            },
          ].map((data, index) => ({
            ...data,
            profile_type_id: individual.id,
            position: index,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          })),
          "*",
        );

        await t
          .from("profile_type")
          .where("id", individual.id)
          .update({ profile_name_pattern: json([firstName.id, " ", lastName.id]) });

        const [name] = await t.from("profile_type_field").insert(
          [
            {
              type: "SHORT_TEXT" as const,
              name: { en: "Corporate name", es: "Denominación social" },
              alias: "NAME",
            },
            {
              type: "DATE" as const,
              name: { en: "Date of incorporation", es: "Fecha de constitución" },
              alias: "DATE_OF_INCORPORATION",
              options: knex.raw("?::jsonb", JSON.stringify({ useReplyAsExpiryDate: false })),
            },
            {
              type: "SHORT_TEXT" as const,
              name: { en: "Tax ID", es: "Número de identificación fiscal" },
              alias: "TAX_ID",
            },
            {
              type: "TEXT" as const,
              name: { en: "Address", es: "Domicilio" },
              alias: "ADDRESS",
            },
          ].map((data, index) => ({
            ...data,
            profile_type_id: legalEntity.id,
            position: index,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          })),
          "*",
        );

        await t
          .from("profile_type")
          .where("id", legalEntity.id)
          .update({ profile_name_pattern: json([name.id]) });

        const [type, counterparty] = await t.from("profile_type_field").insert(
          [
            {
              type: "SHORT_TEXT" as const,
              name: { en: "Type of contract", es: "Tipo de contrato" },
              alias: "TYPE",
            },
            {
              type: "SHORT_TEXT" as const,
              name: { en: "Counterparty", es: "Contraparte" },
              alias: "COUNTERPARTY",
            },
            {
              type: "TEXT" as const,
              name: { en: "Short description", es: "Descripción breve" },
              alias: "DESCRIPTION",
            },
            {
              type: "DATE" as const,
              name: { en: "Start date", es: "Fecha de inicio" },
              alias: "START_DATE",
              options: knex.raw("?::jsonb", JSON.stringify({ useReplyAsExpiryDate: false })),
            },
            {
              type: "DATE" as const,
              name: { en: "Expiry date", es: "Fecha de vencimiento" },
              is_expirable: true,
              expiry_alert_ahead_time: knex.raw(`make_interval(months => ?)`, [1]),
              options: knex.raw("?::jsonb", JSON.stringify({ useReplyAsExpiryDate: true })),
              alias: "EXPIRY_DATE",
            },
            {
              type: "NUMBER" as const,
              name: { en: "Amount", es: "Importe" },
              alias: "AMOUNT",
            },
            {
              type: "FILE" as const,
              name: { en: "Document", es: "Documento" },
              alias: "DOCUMENT",
            },
          ].map((data, index) => ({
            ...data,
            profile_type_id: contract.id,
            position: index,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          })),
          "*",
        );

        await t
          .from("profile_type")
          .where("id", contract.id)
          .update({ profile_name_pattern: json([type.id, " - ", counterparty.id]) });
      });
    },
    { concurrency: 1 },
  );

  function json(value: any) {
    return knex.raw("?::jsonb", JSON.stringify(value));
  }
}
