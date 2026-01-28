import { ProfileTypeStandardType } from "@parallel/graphql/__types";

export function getProfileTypeStandardTypeKeywords(type: ProfileTypeStandardType) {
  const genericKeywords = ["identificar", "identify", "propiedades", "properties"];
  switch (type) {
    case "CONTRACT":
      return [...genericKeywords, "contrato", "contract"];
    case "INDIVIDUAL":
      return [
        ...genericKeywords,
        "persona",
        "individual",
        "cliente",
        "client",
        "identificar",
        "identify",
        "KYC",
        "titular real",
        "beneficiario real",
        "real owner",
        "beneficial owner",
        "ubo",
        "representante",
        "representative",
        "administrador",
        "administrator",
      ];
    case "LEGAL_ENTITY":
      return [
        ...genericKeywords,
        "empresa",
        "company",
        "identificar",
        "identify",
        "KYB",
        "cliente",
        "client",
        "proveedor",
        "supplier",
        "provider",
        "sucursal",
        "branch",
        "filial",
        "subsidiary",
      ];
    case "MATTER":
      return [...genericKeywords, "asunto", "expediente", "matter", "case"];
    default:
      throw new Error(`Missing keywords ProfileTypeStandardType  "${type}"`);
  }
}
