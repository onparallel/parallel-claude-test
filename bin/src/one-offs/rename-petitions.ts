import { run } from "../utils/run";

const API_KEY = process.env.API_KEY;
// Plantillas de Saldados
const TEMPLATE_IDS = ["zas25KHxAByKWmEJE2u", "zas25KHxAByKX3pkmhr"];

async function request(
  path: string,
  {
    query,
    method = "GET",
    body,
  }: { query?: URLSearchParams; method?: string; body?: Record<string, any> },
) {
  const res = await fetch(
    `https://www.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}${
      query && query.size > 0 ? `?${query}` : ""
    }`,
    {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${API_KEY}`,
      },
    },
  );
  return await res.json();
}

async function main() {
  const petitions = await request("/petitions", {
    query: new URLSearchParams({
      fromTemplateId: TEMPLATE_IDS.join(","),
      limit: "1000",
      include: "recipients",
    }),
  });

  for (const petition of petitions.items as any[]) {
    const recipient = petition.recipients?.[0]?.contact.fullName;

    if (!recipient || petition.name !== "Saldados - Expediente") continue;
    const name = `Formulario - ${recipient}`;
    console.log(`Renaming petition ${petition.id} as: '${name}'`);
    await request(`/petitions/${petition.id}`, { method: "PUT", body: { name } });
  }
}

run(main);
