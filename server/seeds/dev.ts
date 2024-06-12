import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { Knex } from "knex";
import pMap from "p-map";
import {
  ProfileTypeStandardType,
  User,
  UserData,
  UserGroupPermissionName,
} from "../src/db/__types";
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
      const [individual, legalEntity, contract] = await knex("profile_type").insert(
        [
          {
            name: { en: "Individual", es: "Persona física" },
            standard_type: "INDIVIDUAL" as ProfileTypeStandardType,
          },
          {
            name: { en: "Legal entity", es: "Persona jurídica" },
            standard_type: "LEGAL_ENTITY" as ProfileTypeStandardType,
          },
          {
            name: { en: "Contract", es: "Contrato" },
            standard_type: "CONTRACT" as ProfileTypeStandardType,
          },
        ].map((data) => ({
          ...data,
          org_id: orgId,
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
        })),
        "*",
      );

      const [firstName, lastName] = await knex("profile_type_field").insert(
        [
          {
            type: "SHORT_TEXT" as const,
            name: { en: "First name", es: "Nombre" },
            alias: "p_first_name",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Last name", es: "Apellido" },
            alias: "p_last_name",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Email", es: "Correo electrónico" },
            alias: "p_email",
          },
          {
            type: "PHONE" as const,
            name: { en: "Phone number", es: "Número de teléfono" },
            alias: "p_phone_number",
          },
          {
            type: "PHONE" as const,
            name: { en: "Mobile phone number", es: "Número de teléfono móvil" },
            alias: "p_mobile_phone_number",
          },
          {
            type: "DATE" as const,
            name: { en: "Date of birth", es: "Fecha de nacimiento" },
            alias: "p_birth_date",
            options: { useReplyAsExpiryDate: false },
          },
          {
            type: "SELECT" as const,
            name: { en: "Gender", es: "Género" },
            alias: "p_gender",
            options: {
              values: [
                {
                  value: "M",
                  label: { en: "Male", es: "Hombre" },
                  isStandard: true,
                },
                {
                  value: "F",
                  label: { en: "Female", es: "Mujer" },
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Address", es: "Dirección" },
            alias: "p_address",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "City", es: "Ciudad" },
            alias: "p_city",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Postal code", es: "Código postal" },
            alias: "p_zip",
          },
          {
            type: "SELECT" as const,
            name: { en: "Country of residence", es: "País de residencia" },
            alias: "p_country_of_residence",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "FILE" as const,
            name: { en: "Proof of address document", es: "Documento de prueba de domicilio" },
            alias: "p_proof_of_address_document",
          },
          {
            type: "SELECT" as const,
            name: { en: "Nationality", es: "Nacionalidad" },
            alias: "p_nationality",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "ID number", es: "Número de identificación" },
            alias: "p_tax_id",
          },
          {
            type: "FILE" as const,
            name: { en: "ID document", es: "Documento de identidad" },
            alias: "p_id_document",
          },
          {
            type: "FILE" as const,
            name: { en: "Passport", es: "Pasaporte" },
            alias: "p_passport_document",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Passport number", es: "Número de pasaporte" },
            alias: "p_passport_number",
          },
          {
            type: "SELECT" as const,
            name: { en: "Is PEP?", es: "¿Es PRP?" },
            alias: "p_is_pep",
            options: {
              values: [
                {
                  value: "Y",
                  label: { en: "Yes", es: "Si" },
                  isStandard: true,
                },
                {
                  value: "N",
                  label: { en: "No", es: "No" },
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SELECT" as const,
            name: { en: "Risk", es: "Riesgo" },

            alias: "p_risk",
            options: {
              values: [
                {
                  value: "HIGH",
                  label: { en: "High", es: "Alto" },
                  isStandard: true,
                },
                {
                  value: "MEDIUM_HIGH",
                  label: { en: "Medium-high", es: "Medio-alto" },
                  isStandard: true,
                },
                {
                  value: "MEDIUM",
                  label: { en: "Medium", es: "Medio" },
                  isStandard: true,
                },
                {
                  value: "MEDIUM_LOW",
                  label: { en: "Medium-low", es: "Medio-bajo" },
                  isStandard: true,
                },
                {
                  value: "LOW",
                  label: { en: "Low", es: "Bajo" },
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "FILE" as const,
            name: { en: "Risk assessment", es: "Evaluación de riesgo" },
            alias: "p_risk_assessment",
          },
          {
            type: "TEXT" as const,
            name: { en: "Source of funds", es: "Orígen de los fondos" },
            alias: "p_source_of_funds",
          },
          {
            type: "BACKGROUND_CHECK" as const,
            name: { en: "Background check", es: "Verificación de antecedentes" },
            alias: "p_background_check",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Occupation", es: "Ocupación" },
            alias: "p_occupation",
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

      await knex("profile_type")
        .where("id", individual.id)
        .update({ profile_name_pattern: json([firstName.id, " ", lastName.id]) });

      const [name] = await knex("profile_type_field").insert(
        [
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Entity name", es: "Denominación social" },
            alias: "p_entity_name",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Trade name", es: "Nombre comercial" },
            alias: "p_trade_name",
          },
          {
            type: "SELECT" as const,
            name: { en: "Entity type", es: "Tipo de Entidad" },
            alias: "p_entity_type",
            options: {
              values: [
                {
                  value: "LIMITED_LIABILITY_COMPANY",
                  label: {
                    en: "Limited Liability Company",
                    es: "Sociedad de Responsabilidad Limitada",
                  },
                  isStandard: true,
                },
                {
                  value: "INCORPORATED",
                  label: { en: "Incorporated", es: "Sociedad Anónima" },
                  isStandard: true,
                },
                {
                  value: "LIMITED_LIABILITY_PARTNERSHIP",
                  label: {
                    en: "Limited Liability Partnership",
                    es: "Sociedad Limitada Profesional",
                  },
                  isStandard: true,
                },
                {
                  value: "FOUNDATION",
                  label: { en: "Foundation", es: "Fundación" },
                  isStandard: true,
                },
                {
                  value: "ASSOCIATION",
                  label: { en: "Association", es: "Asociación" },
                  isStandard: true,
                },
                {
                  value: "TRUST",
                  label: { en: "Trust", es: "Trust" },
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Registration number", es: "Número de registro" },
            alias: "p_registration_number",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Tax ID", es: "Número de identificación fiscal" },
            alias: "p_tax_id",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Registered address", es: "Domicilio social" },
            alias: "p_registered_address",
          },
          {
            type: "SELECT" as const,
            name: { en: "Country of incorporation", es: "País de constitución" },
            alias: "p_country_of_incorporation",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Main business activity", es: "Actividad comercial principal" },
            alias: "p_main_business_activity",
          },
          {
            type: "FILE" as const,
            name: { en: "Ownership structure", es: "Estructura de propiedad" },
            alias: "p_ownership_structure",
          },
          {
            type: "FILE" as const,
            name: { en: "UBO statement", es: "Acta de titularidad real" },
            alias: "p_ubo_statement",
          },
          {
            type: "FILE" as const,
            name: { en: "Financial statements", es: "Estados financieros" },
            alias: "p_financial_statements",
          },
          {
            type: "SELECT" as const,
            name: { en: "Risk", es: "Riesgo" },
            alias: "p_risk",
            options: {
              values: [
                {
                  value: "HIGH",
                  label: { en: "High", es: "Alto" },
                  isStandard: true,
                },
                {
                  value: "MEDIUM_HIGH",
                  label: { en: "Medium-high", es: "Medio-alto" },
                  isStandard: true,
                },
                {
                  value: "MEDIUM",
                  label: { en: "Medium", es: "Medio" },
                  isStandard: true,
                },
                {
                  value: "MEDIUM_LOW",
                  label: { en: "Medium-low", es: "Medio-bajo" },
                  isStandard: true,
                },
                {
                  value: "LOW",
                  label: { en: "Low", es: "Bajo" },
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "FILE" as const,
            name: { en: "Risk assessment", es: "Evaluación de riesgo" },
            alias: "p_risk_assessment",
          },
          {
            type: "SELECT" as const,
            name: { en: "Power of attorney types", es: "Tipos de Poderes" },
            alias: "p_poa_types",
            options: {
              values: [
                {
                  value: "GENERAL_POA",
                  label: { en: "General power of attorney", es: "Poder general" },
                  isStandard: true,
                },
                {
                  value: "SPECIAL_POA",
                  label: { en: "Special power of attorney", es: "Poder especial" },
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Power of attorney scope", es: "" },
            alias: "p_poa_scope",
          },
          {
            type: "FILE" as const,
            name: { en: "Power of attorney document", es: "Alcance del Poder" },
            alias: "p_poa_document",
          },
          {
            type: "DATE" as const,
            name: { en: "Effective date of power of attorney", es: "Fecha de inicio del poder" },
            alias: "p_poa_effective_date",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
          {
            type: "DATE" as const,
            name: {
              en: "Expiration date of power of attorney",
              es: "Fecha de vencimiento del poder",
            },
            alias: "p_poa_expiration_date",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Revocation conditions", es: "Condiciones de revocación" },
            alias: "p_poa_revocation_conditions",
          },
          {
            type: "SELECT" as const,
            name: {
              en: "Registered power of attorney",
              es: "Poder de representación registrado",
            },
            alias: "p_poa_registered",
            options: {
              values: [
                {
                  value: "Y",
                  label: { en: "Yes", es: "Si" },
                  isStandard: true,
                },
                {
                  value: "N",
                  label: { en: "No", es: "No" },
                  isStandard: true,
                },
              ],
            },
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

      await knex("profile_type")
        .where("id", legalEntity.id)
        .update({ profile_name_pattern: json([name.id]) });

      const [counterParty, contractType] = await knex("profile_type_field").insert(
        [
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Counterparty", es: "Contraparte" },
            alias: "p_counterparty",
          },
          {
            type: "SELECT" as const,
            name: { en: "Contract type", es: "Tipo de contrato" },
            alias: "p_contract_type",
            options: {
              values: [
                {
                  value: "SERVICE_AGREEMENT",
                  label: { en: "Service agreement", es: "Contrato de servicios" },
                  isStandard: true,
                },
                {
                  value: "EMPLOYMENT_CONTRACT",
                  label: { en: "Employment contract", es: "Contrato de trabajo" },
                  isStandard: true,
                },
                {
                  value: "LEASE_AGREEMENT",
                  label: { en: "Lease agreement", es: "Contrato de arrendamiento" },
                  isStandard: true,
                },
                {
                  value: "SALES_CONTRACT",
                  label: { en: "Sales contract", es: "Contrato de venta" },
                  isStandard: true,
                },
                {
                  value: "NDA",
                  label: {
                    en: "Non-Disclosure Agreement (NDA)",
                    es: "Acuerdo de confidencialidad (NDA)",
                  },
                  isStandard: true,
                },
                {
                  value: "PARTNERSHIP_AGREEMENT",
                  label: { en: "Partnership agreement", es: "Contrato de colaboración" },
                  isStandard: true,
                },
                {
                  value: "SUPPLY_CONTRACT",
                  label: { en: "Supply contract", es: "Contrato de suministro" },
                  isStandard: true,
                },
                {
                  value: "CONSULTING_AGREEMENT",
                  label: { en: "Consulting agreement", es: "Contrato de consultoría" },
                  isStandard: true,
                },
                {
                  value: "SOFTWARE_DEVELOPMENT_AGREEMENT",
                  label: {
                    en: "Software development agreement",
                    es: "Contrato de desarrollo de software",
                  },
                  isStandard: true,
                },
                {
                  value: "PURCHASE_ORDER",
                  label: { en: "Purchase order", es: "Orden de compra" },
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "DATE" as const,
            name: { en: "Effective date", es: "Fecha de inicio" },
            alias: "p_effective_date",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
          {
            type: "DATE" as const,
            name: { en: "Expiration date", es: "Fecha de vencimiento" },
            alias: "p_expiration_date",
            options: {
              useReplyAsExpiryDate: true,
            },
            is_expirable: true,
            expiry_alert_ahead_time: { months: 1 },
          },
          {
            type: "SELECT" as const,
            name: { en: "Jurisdiction", es: "Jurisdicción" },
            alias: "p_jurisdiction",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "NUMBER" as const,
            name: { en: "Contract value", es: "Valor del contrato" },
            alias: "p_contract_value",
          },
          {
            type: "SELECT" as const,
            name: { en: "Currency", es: "Moneda" },
            alias: "p_contract_currency",
            options: {
              values: [],
              standardList: "CURRENCIES",
            },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Payment terms", es: "Términos de pago" },
            alias: "p_payment_terms",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Renewal terms", es: "Términos de renovación" },
            alias: "p_renewal_terms",
          },
          {
            type: "FILE" as const,
            name: { en: "Original document", es: "Documento original" },
            alias: "p_original_document",
          },
          {
            type: "FILE" as const,
            name: { en: "Amendments", es: "Enmiendas" },
            alias: "p_amendments",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Termination clauses", es: "Cláusulas de terminación" },
            alias: "p_termination_clauses",
          },
          {
            type: "SELECT" as const,
            name: { en: "Confidentiality agreement", es: "Acuerdo de confidencialidad" },
            alias: "p_confidentiality_agreement",
            options: {
              values: [
                {
                  value: "Y",
                  label: { en: "Yes", es: "Si" },
                  isStandard: true,
                },
                {
                  value: "N",
                  label: { en: "No", es: "No" },
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Performance metrics", es: "Métricas de desempeño" },
            alias: "p_performance_metrics",
          },
          {
            type: "SHORT_TEXT" as const,
            name: {
              en: "Dispute resolution mechanism",
              es: "Mecanismo de resolución de disputas",
            },
            alias: "p_dispute_resolution_mechanism",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Compliance obligations", es: "Obligaciones de cumplimiento" },
            alias: "p_compliance_obligations",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Security provisions", es: "Provisiones de seguridad" },
            alias: "p_security_provisions",
          },
          {
            type: "TEXT" as const,
            name: { en: "Notes", es: "Notas" },
            alias: "p_notes",
          },
          {
            type: "SHORT_TEXT" as const,
            name: {
              en: "Billing contact full name",
              es: "Nombre completo del contacto de facturación",
            },
            alias: "p_billing_contact_full_name",
          },
          {
            type: "SHORT_TEXT" as const,
            name: {
              en: "Billing contact email",
              es: "Correo electrónico del contacto de facturación",
            },
            alias: "p_billing_contact_email",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Legal contact full name", es: "Nombre completo del contacto de legal" },
            alias: "p_legal_contact_full_name",
          },
          {
            type: "SHORT_TEXT" as const,
            name: { en: "Legal contact email", es: "Correo electrónico del contacto de legal" },
            alias: "p_legal_contact_email",
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

      await knex("profile_type")
        .where("id", contract.id)
        .update({ profile_name_pattern: json([contractType.id, " - ", counterParty.id]) });

      // profile relationships
      const relationships = await knex("profile_relationship_type")
        .insert(
          [
            {
              alias: "p_parent__child",
              left_right_name: { en: "Parent", es: "Padre/Madre" },
              right_left_name: { en: "Child", es: "Hijo/Hija" },
            },
            {
              alias: "p_family_member",
              left_right_name: { en: "Family member", es: "Familiar" },
              right_left_name: null,
              is_reciprocal: true,
            },
            {
              alias: "p_close_associate",
              left_right_name: { en: "Close associate", es: "Asociado cercano" },
              right_left_name: null,
              is_reciprocal: true,
            },
            {
              alias: "p_spouse",
              left_right_name: { en: "Spouse", es: "Cónyuge" },
              right_left_name: null,
              is_reciprocal: true,
            },
            {
              alias: "p_legal_representative__legally_represented",
              left_right_name: { en: "Legal representative", es: "Representante legal" },
              right_left_name: { en: "Legally represented", es: "Representado" },
            },
            {
              alias: "p_legal_guardian__legally_guarded",
              left_right_name: { en: "Legal guardian", es: "Tutor legal" },
              right_left_name: { en: "Legally guarded", es: "Tutorizado legal" },
            },
            {
              alias: "p_director__managed_by",
              left_right_name: { en: "Director", es: "Administrador" },
              right_left_name: { en: "Managed by", es: "Gestionada" },
            },
            {
              alias: "p_shareholder__participated_in_by",
              left_right_name: { en: "Shareholder", es: "Socio" },
              right_left_name: { en: "Participated in by", es: "Participada" },
            },
            {
              alias: "p_beneficial_owner__direct_or_indirect_property",
              left_right_name: { en: "Beneficial owner", es: "Titular real" },
              right_left_name: {
                en: "Direct or indirect property",
                es: "Propiedad directa o indirecta",
              },
            },
            {
              alias: "p_parent_company__subsidiary",
              left_right_name: { en: "Parent company", es: "Matriz" },
              right_left_name: { en: "Subsidiary", es: "Filial" },
            },
            {
              alias: "p_main_office__branch_office",
              left_right_name: { en: "Main office", es: "Sede central" },
              right_left_name: { en: "Branch office", es: "Sucursal" },
            },
            {
              alias: "p_associated_company",
              left_right_name: { en: "Associated company", es: "Empresa asociada" },
              right_left_name: null,
              is_reciprocal: true,
            },
            {
              alias: "p_main_contract__annex",
              left_right_name: { en: "Main contract", es: "Contrato principal" },
              right_left_name: { en: "Annex", es: "Anexo" },
            },
            {
              alias: "p_addendum__amended_by",
              left_right_name: { en: "Addendum", es: "Adenda" },
              right_left_name: { en: "Amended by", es: "Modificado por" },
            },
            {
              alias: "p_contract__counterparty",
              left_right_name: { en: "Contract", es: "Contrato" },
              right_left_name: { en: "Counterparty", es: "Contraparte" },
            },
          ].map((data) => ({
            ...data,
            org_id: orgId,
            created_by: `User:${ownerId}`,
            updated_by: `User:${ownerId}`,
          })),
        )
        .onConflict(knex.raw('("org_id", "alias") where deleted_at is null'))
        .ignore()
        .returning("*");

      await knex("profile_relationship_type_allowed_profile_type").insert(
        [
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find((r) => r.alias === "p_parent__child")!
              .id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find((r) => r.alias === "p_parent__child")!
              .id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find((r) => r.alias === "p_family_member")!
              .id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find((r) => r.alias === "p_family_member")!
              .id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_close_associate",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_close_associate",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find((r) => r.alias === "p_spouse")!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find((r) => r.alias === "p_spouse")!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_legal_representative__legally_represented",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_legal_representative__legally_represented",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_legal_guardian__legally_guarded",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_legal_guardian__legally_guarded",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_director__managed_by",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_shareholder__participated_in_by",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_beneficial_owner__direct_or_indirect_property",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: individual.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_contract__counterparty",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_legal_representative__legally_represented",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_director__managed_by",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_shareholder__participated_in_by",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_beneficial_owner__direct_or_indirect_property",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_parent_company__subsidiary",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_parent_company__subsidiary",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_main_office__branch_office",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_main_office__branch_office",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_associated_company",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_associated_company",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: legalEntity.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_contract__counterparty",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: contract.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_main_contract__annex",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: contract.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_main_contract__annex",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: contract.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_addendum__amended_by",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
          {
            allowed_profile_type_id: contract.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_addendum__amended_by",
            )!.id,
            direction: "RIGHT_LEFT" as const,
          },
          {
            allowed_profile_type_id: contract.id,
            profile_relationship_type_id: relationships.find(
              (r) => r.alias === "p_contract__counterparty",
            )!.id,
            direction: "LEFT_RIGHT" as const,
          },
        ].map((data) => ({
          ...data,
          org_id: orgId,
          created_by: `User:${ownerId}`,
          updated_by: `User:${ownerId}`,
        })),
      );
    },
    { concurrency: 1 },
  );

  function json(value: any) {
    return knex.raw("?::jsonb", JSON.stringify(value));
  }
}
