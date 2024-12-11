import { Knex } from "knex";
import { DashboardModuleSize, DashboardModuleType } from "../src/db/__types";
import { loadEnv } from "../src/util/loadEnv";

export async function seed(knex: Knex): Promise<any> {
  await loadEnv();

  const [rootOrg] = await knex.from("organization").where("status", "ROOT").select("*");

  const [existing] = await knex
    .from("dashboard")
    .where("org_id", rootOrg.id)
    .whereNull("deleted_at")
    .orderBy("position", "desc")
    .limit(1)
    .select("*");

  const [dashboard] = await knex.from("dashboard").insert(
    [
      {
        name: "Mock Dashboard",
        org_id: rootOrg.id,
        position: existing ? existing.position + 1 : 0,
      },
    ],
    "*",
  );

  const profileTypes = await knex
    .from("profile_type")
    .whereNotNull("standard_type")
    .whereNull("deleted_at")
    .where("org_id", rootOrg.id)
    .select("*");

  const individual = profileTypes.find((pt) => pt.standard_type === "INDIVIDUAL")!;

  await knex.from("dashboard_module").insert(
    [
      {
        type: "PROFILES_NUMBER",
        size: "SMALL",
        title: "Total clientes (Personas físicas)",
        settings: JSON.stringify({
          type: "COUNT",
          profileTypeId: individual.id,
          filters: {},
        }),
      },
      {
        type: "PROFILES_RATIO",
        size: "SMALL",
        title: "Perfiles abiertos (incongruente)",
        settings: JSON.stringify({
          graphicType: "PERCENTAGE",
          type: "COUNT",
          profileTypeId: individual.id,
          filters: [{ status: ["OPEN"] }, { status: ["CLOSED", "DELETION_SCHEDULED"] }],
        }),
      },
      {
        type: "PETITIONS_NUMBER",
        size: "SMALL",
        title: "Total parallels pendientes",
        settings: JSON.stringify({
          filters: {
            status: ["PENDING"],
          },
        }),
      },
      {
        type: "CREATE_PETITION_BUTTON",
        size: "SMALL",
        title: "Know your customer...",
        settings: JSON.stringify({
          label: "Iniciar KYC",
          template_id: 1,
        }),
      },
      {
        type: "PETITIONS_PIE_CHART",
        size: "MEDIUM",
        title: "Estado de los parallels",
        settings: JSON.stringify({
          graphicType: "DOUGHNUT",
          items: [
            {
              label: "Borradores",
              color: "#ECC94B",
              filter: { status: ["DRAFT"] },
            },
            {
              label: "Pendientes",
              color: "#D69E2E",
              filter: { status: ["PENDING"] },
            },
            {
              label: "Completados",
              color: "#68D391",
              filter: { status: ["COMPLETED"] },
            },
            {
              label: "Cerrados",
              color: "#2F855A",
              filter: { status: ["CLOSED"] },
            },
          ],
        }),
      },
      {
        type: "PETITIONS_RATIO",
        size: "MEDIUM",
        title: "% pendientes",
        settings: JSON.stringify({
          graphicType: "PERCENTAGE",
          filters: [
            { status: ["PENDING"] },
            { status: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"] },
          ],
        }),
      },
      {
        type: "PROFILES_PIE_CHART",
        size: "LARGE",
        title: "Estado de los perfiles",
        settings: JSON.stringify({
          graphicType: "PIE",
          type: "COUNT",
          profileTypeId: individual.id,
          items: [
            { label: "Abiertos", color: "#ECC94B", filter: { status: ["OPEN"] } },
            { label: "Cerrados", color: "#D69E2E", filter: { status: ["CLOSED"] } },
            {
              label: "Programados para eliminación",
              color: "#68D391",
              filter: { status: ["DELETION_SCHEDULED"] },
            },
          ],
        }),
      },
    ].map((module, position) => ({
      ...module,
      type: module.type as DashboardModuleType,
      position,
      size: module.size as DashboardModuleSize,
      dashboard_id: dashboard.id,
    })),
  );
}
