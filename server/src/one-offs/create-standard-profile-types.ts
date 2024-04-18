import { Knex, knex } from "knex";
import { maxBy } from "remeda";
import {
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  ProfileTypeStandardType,
  ProfileTypeStandardTypeValues,
} from "../db/__types";
import { loadEnv } from "../util/loadEnv";

async function initKnex() {
  await loadEnv();
  return knex({
    client: "pg",
    connection: {
      host: process.env.DB_HOST!,
      database: process.env.DB_DATABASE!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      port: parseInt(process.env.DB_PORT!),
    },
  });
}

const properties: Record<ProfileTypeStandardType, Partial<ProfileTypeField>[]> = {
  CONTRACT: [
    {
      type: "SHORT_TEXT",
      name: { en: "Counterparty", es: "Contraparte" },
      alias: "p_counterparty",
    },
    {
      type: "SELECT",
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
      type: "DATE",
      name: { en: "Effective date", es: "Fecha de inicio" },
      alias: "p_effective_date",
      options: {
        useReplyAsExpiryDate: false,
      },
    },
    {
      type: "DATE",
      name: { en: "Expiration date", es: "Fecha de vencimiento" },
      alias: "p_expiration_date",
      options: {
        useReplyAsExpiryDate: true,
      },
      is_expirable: true,
      expiry_alert_ahead_time: { months: 1 },
    },
    {
      type: "SELECT",
      name: { en: "Jurisdiction", es: "Jurisdicción" },
      alias: "p_jurisdiction",
      options: {
        values: [],
        standardList: "COUNTRIES",
      },
    },
    {
      type: "NUMBER",
      name: { en: "Contract value", es: "Valor del contrato" },
      alias: "p_contract_value",
    },
    {
      type: "SELECT",
      name: { en: "Currency", es: "Moneda" },
      alias: "p_contract_currency",
      options: {
        values: [],
        standardList: "CURRENCIES",
      },
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Payment terms", es: "Términos de pago" },
      alias: "p_payment_terms",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Renewal terms", es: "Términos de renovación" },
      alias: "p_renewal_terms",
    },
    {
      type: "FILE",
      name: { en: "Original document", es: "Documento original" },
      alias: "p_original_document",
    },
    {
      type: "FILE",
      name: { en: "Amendments", es: "Enmiendas" },
      alias: "p_amendments",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Termination clauses", es: "Cláusulas de terminación" },
      alias: "p_termination_clauses",
    },
    {
      type: "SELECT",
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
      type: "SHORT_TEXT",
      name: { en: "Performance metrics", es: "Métricas de desempeño" },
      alias: "p_performance_metrics",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Dispute resolution mechanism", es: "Mecanismo de resolución de disputas" },
      alias: "p_dispute_resolution_mechanism",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Compliance obligations", es: "Obligaciones de cumplimiento" },
      alias: "p_compliance_obligations",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Security provisions", es: "Provisiones de seguridad" },
      alias: "p_security_provisions",
    },
    {
      type: "TEXT",
      name: { en: "Notes", es: "Notas" },
      alias: "p_notes",
    },
    {
      type: "SHORT_TEXT",
      name: {
        en: "Billing contact full name",
        es: "Nombre completo del contacto de facturación",
      },
      alias: "p_billing_contact_full_name",
    },
    {
      type: "SHORT_TEXT",
      name: {
        en: "Billing contact email",
        es: "Correo electrónico del contacto de facturación",
      },
      alias: "p_billing_contact_email",
      options: {
        format: "EMAIL",
      },
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Legal contact full name", es: "Nombre completo del contacto de legal" },
      alias: "p_legal_contact_full_name",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Legal contact email", es: "Correo electrónico del contacto de legal" },
      alias: "p_legal_contact_email",
      options: {
        format: "EMAIL",
      },
    },
  ],
  INDIVIDUAL: [
    {
      type: "SHORT_TEXT",
      name: { en: "First name", es: "Nombre" },
      alias: "p_first_name",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Last name", es: "Apellido" },
      alias: "p_last_name",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Email", es: "Correo electrónico" },
      alias: "p_email",
      options: { format: "EMAIL" },
    },
    {
      type: "PHONE",
      name: { en: "Phone number", es: "Número de teléfono" },
      alias: "p_phone_number",
    },
    {
      type: "PHONE",
      name: { en: "Mobile phone number", es: "Número de teléfono móvil" },
      alias: "p_mobile_phone_number",
    },
    {
      type: "DATE",
      name: { en: "Date of birth", es: "Fecha de nacimiento" },
      alias: "p_birth_date",
      options: { useReplyAsExpiryDate: false },
    },
    {
      type: "SELECT",
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
      type: "SHORT_TEXT",
      name: { en: "Address", es: "Dirección" },
      alias: "p_address",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "City", es: "Ciudad" },
      alias: "p_city",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Postal code", es: "Código postal" },
      alias: "p_zip",
    },
    {
      type: "SELECT",
      name: { en: "Country of residence", es: "País de residencia" },
      alias: "p_country_of_residence",
      options: {
        values: [],
        standardList: "COUNTRIES",
      },
    },
    {
      type: "FILE",
      name: { en: "Proof of address document", es: "Documento de prueba de domicilio" },
      alias: "p_proof_of_address_document",
    },
    {
      type: "SELECT",
      name: { en: "Citizenship", es: "Nacionalidad" },
      alias: "p_citizenship",
      options: {
        values: [],
        standardList: "COUNTRIES",
      },
    },
    {
      type: "SHORT_TEXT",
      name: { en: "ID number", es: "Número de identificación" },
      alias: "p_tax_id",
    },
    {
      type: "FILE",
      name: { en: "ID document", es: "Documento de identidad" },
      alias: "p_id_document",
    },
    {
      type: "FILE",
      name: { en: "Passport", es: "Pasaporte" },
      alias: "p_passport_document",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Passport number", es: "Número de pasaporte" },
      alias: "p_passport_number",
    },
    {
      type: "SELECT",
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
      type: "SELECT",
      name: { en: "Risk", es: "Riesgo" },
      alias: "p_risk",
      options: {
        showOptionsWithColors: true,
        values: [
          {
            value: "HIGH",
            label: { en: "High", es: "Alto" },
            isStandard: true,
            color: "#FED7D7",
          },
          {
            value: "MEDIUM_HIGH",
            label: { en: "Medium-high", es: "Medio-alto" },
            isStandard: true,
            color: "#FEEBC8",
          },
          {
            value: "MEDIUM",
            label: { en: "Medium", es: "Medio" },
            isStandard: true,
            color: "#F5EFE8",
          },
          {
            value: "MEDIUM_LOW",
            label: { en: "Medium-low", es: "Medio-bajo" },
            isStandard: true,
            color: "#CEEDFF",
          },
          {
            value: "LOW",
            label: { en: "Low", es: "Bajo" },
            isStandard: true,
            color: "#D5E7DE",
          },
        ],
      },
    },
    {
      type: "FILE",
      name: { en: "Risk assessment", es: "Evaluación de riesgo" },
      alias: "p_risk_assessment",
    },
    {
      type: "TEXT",
      name: { en: "Source of funds", es: "Orígen de los fondos" },
      alias: "p_source_of_funds",
    },
    {
      type: "BACKGROUND_CHECK",
      name: { en: "Background check", es: "Verificación de antecedentes" },
      alias: "p_background_check",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Occupation", es: "Ocupación" },
      alias: "p_occupation",
    },
  ],
  LEGAL_ENTITY: [
    {
      type: "SHORT_TEXT",
      name: { en: "Entity name", es: "Denominación social" },
      alias: "p_entity_name",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Trade name", es: "Nombre comercial" },
      alias: "p_trade_name",
    },
    {
      type: "SELECT",
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
            label: { en: "Limited Liability Partnership", es: "Sociedad Limitada Profesional" },
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
      type: "SHORT_TEXT",
      name: { en: "Registration number", es: "Número de registro" },
      alias: "p_registration_number",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Tax ID", es: "Número de identificación fiscal" },
      alias: "p_tax_id",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Registered address", es: "Domicilio social" },
      alias: "p_registered_address",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "City", es: "Ciudad" },
      alias: "p_city",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "ZIP Code", es: "Código postal" },
      alias: "p_zip",
    },
    {
      type: "SELECT",
      name: { en: "Country of incorporation", es: "País de constitución" },
      alias: "p_country_of_incorporation",
      options: {
        values: [],
        standardList: "COUNTRIES",
      },
    },
    {
      type: "DATE",
      name: { en: "Date of incorporation", es: "Fecha de constitución" },
      alias: "p_date_of_incorporation",
      options: {
        useReplyAsExpiryDate: false,
      },
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Main business activity", es: "Actividad comercial principal" },
      alias: "p_main_business_activity",
    },
    {
      type: "FILE",
      name: { en: "Ownership structure", es: "Estructura de propiedad" },
      alias: "p_ownership_structure",
    },
    {
      type: "FILE",
      name: { en: "UBO statement", es: "Acta de titularidad real" },
      alias: "p_ubo_statement",
    },
    {
      type: "FILE",
      name: { en: "Financial statements", es: "Estados financieros" },
      alias: "p_financial_statements",
    },
    {
      type: "SELECT",
      name: { en: "Risk", es: "Riesgo" },
      alias: "p_risk",
      options: {
        showOptionsWithColors: true,
        values: [
          {
            value: "HIGH",
            label: { en: "High", es: "Alto" },
            isStandard: true,
            color: "#FED7D7",
          },
          {
            value: "MEDIUM_HIGH",
            label: { en: "Medium-high", es: "Medio-alto" },
            isStandard: true,
            color: "#FEEBC8",
          },
          {
            value: "MEDIUM",
            label: { en: "Medium", es: "Medio" },
            isStandard: true,
            color: "#F5EFE8",
          },
          {
            value: "MEDIUM_LOW",
            label: { en: "Medium-low", es: "Medio-bajo" },
            isStandard: true,
            color: "#CEEDFF",
          },
          {
            value: "LOW",
            label: { en: "Low", es: "Bajo" },
            isStandard: true,
            color: "#D5E7DE",
          },
        ],
      },
    },
    {
      type: "FILE",
      name: { en: "Risk assessment", es: "Evaluación de riesgo" },
      alias: "p_risk_assessment",
    },
    {
      type: "SELECT",
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
      type: "SHORT_TEXT",
      name: { en: "Power of attorney scope", es: "Alcance del Poder" },
      alias: "p_poa_scope",
    },
    {
      type: "FILE",
      name: { en: "Power of attorney document", es: "Documento del poder de representación" },
      alias: "p_poa_document",
    },
    {
      type: "DATE",
      name: { en: "Effective date of power of attorney", es: "Fecha de inicio del poder" },
      alias: "p_poa_effective_date",
    },
    {
      type: "DATE",
      name: {
        en: "Expiration date of power of attorney",
        es: "Fecha de vencimiento del poder",
      },
      alias: "p_poa_expiration_date",
    },
    {
      type: "SHORT_TEXT",
      name: { en: "Revocation conditions", es: "Condiciones de revocación" },
      alias: "p_poa_revocation_conditions",
    },
    {
      type: "SELECT",
      name: { en: "Registered power of attorney", es: "Poder de representación registrado" },
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
  ],
};

async function createStandardContractProfileType(knex: Knex, orgId: number, createdBy: string) {
  const [contract] = await knex
    .from("profile_type")
    .insert({
      org_id: orgId,
      created_by: createdBy,
      name: { en: "Contract", es: "Contrato" },
      standard_type: "CONTRACT",
    })
    .returning("*");

  const fields = await knex
    .from("profile_type_field")
    .insert(
      properties.CONTRACT.map((v, position) => ({
        alias: v.alias,
        name: v.name,
        options: v.options,
        type: v.type as ProfileTypeFieldType,
        position,
        permission: "WRITE",
        is_expirable: v.is_expirable ?? false,
        expiry_alert_ahead_time: v.expiry_alert_ahead_time ?? null,
        profile_type_id: contract.id,
        created_by: createdBy,
      })),
    )
    .returning("*");

  const contractType = fields.find((f) => f.alias === "p_contract_type")!;
  const counterParty = fields.find((f) => f.alias === "p_counterparty")!;

  await knex
    .from("profile_type")
    .where("id", contract.id)
    .update({
      profile_name_pattern: JSON.stringify([contractType.id, " - ", counterParty.id]),
    });
}

async function createStandardIndividualContractType(knex: Knex, orgId: number, createdBy: string) {
  const [individual] = await knex
    .from("profile_type")
    .insert({
      org_id: orgId,
      created_by: createdBy,
      name: { en: "Individual", es: "Persona física" },
      standard_type: "INDIVIDUAL",
    })
    .returning("*");

  const fields = await knex
    .from("profile_type_field")
    .insert(
      properties.INDIVIDUAL.map((v, position) => ({
        alias: v.alias,
        name: v.name,
        options: v.options,
        type: v.type as ProfileTypeFieldType,
        position,
        permission: "WRITE",
        profile_type_id: individual.id,
        created_by: createdBy,
      })),
    )
    .returning("*");

  const firstName = fields.find((f) => f.alias === "p_first_name")!;
  const lastName = fields.find((f) => f.alias === "p_last_name")!;

  await knex
    .from("profile_type")
    .where("id", individual.id)
    .update({
      profile_name_pattern: JSON.stringify([firstName.id, " ", lastName.id]),
    });
}

async function createStandardLegalEntityContractType(knex: Knex, orgId: number, createdBy: string) {
  const [legalEntity] = await knex
    .from("profile_type")
    .insert({
      org_id: orgId,
      created_by: createdBy,
      name: { en: "Legal entity", es: "Persona jurídica" },
      standard_type: "LEGAL_ENTITY",
    })
    .returning("*");

  const fields = await knex
    .from("profile_type_field")
    .insert(
      properties.LEGAL_ENTITY.map((v, position) => ({
        alias: v.alias,
        name: v.name,
        options: v.options,
        type: v.type as ProfileTypeFieldType,
        position,
        permission: "WRITE",
        profile_type_id: legalEntity.id,
        created_by: createdBy,
      })),
    )
    .returning("*");

  const entityName = fields.find((f) => f.alias === "p_entity_name")!;

  await knex
    .from("profile_type")
    .where("id", legalEntity.id)
    .update({
      profile_name_pattern: JSON.stringify([entityName.id]),
    });
}

async function fetchMissingStandardTypes(knex: Knex, orgId: number) {
  const data = await knex.raw<{
    rows: { standard_type: ProfileTypeStandardType }[];
  }>(
    /* sql */ `
    with all_types as (
      select * from (values ('CONTRACT'), ('INDIVIDUAL'), ('LEGAL_ENTITY')) as t("standard_type")
    ),
    current_types as (
      select standard_type from profile_type where org_id = ? and standard_type is not null and deleted_at is null and archived_at is null
    )
    select a_t.* from all_types a_t left join current_types c_t on a_t.standard_type::profile_type_standard_type = c_t.standard_type::profile_type_standard_type
    where c_t.standard_type is null;
  `,
    [orgId],
  );

  return data.rows;
}

function sqlIn(knex: Knex, array: readonly Knex.RawBinding[]) {
  return knex.raw(/* sql */ `(${array.map(() => "?").join(", ")})`, [...array]);
}

async function main() {
  const knex = await initKnex();

  const orgOwners = await knex
    .from("user")
    .whereNull("deleted_at")
    .where("is_org_owner", true)
    .select("*")
    .orderBy("org_id");

  let i = 0;
  for (const { id: ownerId, org_id: orgId } of orgOwners) {
    console.log(`Processing Org:${orgId} (${++i}/${orgOwners.length})`);
    const { rows: unusedProfileTypes } = await knex.raw<{ rows: Pick<ProfileType, "id">[] }>(
      /* sql */ `
        select pt.id from profile_type pt
        where pt.id not in (
          select distinct (p.profile_type_id) from "profile" p
          where p.org_id = :orgId and p.deleted_at is null
        )
        and pt.org_id = :orgId
        and pt.standard_type is null
        and pt.deleted_at is null;
      `,
      { orgId },
    );

    if (unusedProfileTypes.length > 0) {
      await knex.raw(
        /* sql */ `
        update profile_type_field_permission
        set
          deleted_at = now(),
          deleted_by = ?
        where profile_type_field_id in (
          select ptf.id from profile_type_field ptf where ptf.profile_type_id in ?
        );
      `,
        [
          `User:${ownerId}`,
          sqlIn(
            knex,
            unusedProfileTypes.map((pt) => pt.id),
          ),
        ],
      );

      await knex.raw(
        /* sql */ `
        update profile_type_field
        set
          deleted_at = now(),
          deleted_by = ?
        where profile_type_id in ?;
      `,
        [
          `User:${ownerId}`,
          sqlIn(
            knex,
            unusedProfileTypes.map((pt) => pt.id),
          ),
        ],
      );

      await knex.raw(
        /* sql */ `
        update profile_type
        set 
          deleted_at = now(),
          archived_at = now(),
          deleted_by = ?
        where id in ?;
      `,
        [
          `User:${ownerId}`,
          sqlIn(
            knex,
            unusedProfileTypes.map((pt) => pt.id),
          ),
        ],
      );
    }

    const missingStandardTypes = await fetchMissingStandardTypes(knex, orgId);
    for (const { standard_type: standardType } of missingStandardTypes) {
      switch (standardType) {
        case "CONTRACT":
          await createStandardContractProfileType(knex, orgId, `User:${ownerId}`);
          break;
        case "INDIVIDUAL":
          await createStandardIndividualContractType(knex, orgId, `User:${ownerId}`);
          break;
        case "LEGAL_ENTITY":
          await createStandardLegalEntityContractType(knex, orgId, `User:${ownerId}`);
          break;
        default:
          throw new Error(`Unknown standard type: ${standardType}`);
      }
    }

    // on each of the standard profile types, make sure every property is there. This way we can add missing properties to incomplete standard types
    for (const standardType of ProfileTypeStandardTypeValues) {
      const [profileType] = await knex
        .from("profile_type")
        .where({ org_id: orgId, standard_type: standardType, deleted_at: null })
        .select("*");

      const currentProperties = await knex
        .from("profile_type_field")
        .where("profile_type_id", profileType.id)
        .whereNull("deleted_at")
        .select("*");

      let position = maxBy(currentProperties, (p) => p.position)?.position ?? 0;
      for (const property of properties[standardType]) {
        const existingProperty = currentProperties.find((p) => p.alias === property.alias);
        if (!existingProperty) {
          console.log(`Adding missing property ${property.alias} to ${standardType}`);
          await knex.from("profile_type_field").insert({
            alias: property.alias,
            name: property.name,
            options: property.options,
            type: property.type as ProfileTypeFieldType,
            position: ++position,
            permission: "WRITE",
            profile_type_id: profileType.id,
            created_by: `User:${ownerId}`,
            is_expirable: property.is_expirable ?? false,
            expiry_alert_ahead_time: property.expiry_alert_ahead_time ?? null,
          });
        }
      }
    }
  }
}

main().then(() => {
  console.log("done");
  process.exit(0);
});
