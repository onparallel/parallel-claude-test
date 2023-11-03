import fetch from "node-fetch";
import { run } from "../utils/run";
import { wait } from "../utils/wait";
import { range } from "remeda";

const { API_KEY, AMOUNT } = process.env;

async function request<T = any>(
  path: string,
  { method = "GET", body }: { method?: string; body?: Record<string, any> },
) {
  const res = await fetch(
    `https://test-subdomain.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}`,
    {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${API_KEY}`,
      },
    },
  );
  return (await res.json()) as T;
}

async function main() {
  const templateId = "EAwW2jXkP4C9LZvbk3";

  if (!AMOUNT || isNaN(Number(AMOUNT))) {
    throw new Error("Please specify AMOUNT env var");
  }

  const body = range(0, parseInt(AMOUNT)).map((i) => ({
    contacts: [
      { email: "santi@onparallel.com", firstName: "Santi" },
      { email: "mariano@onparallel.com", firstName: "Mariano" },
    ],
    prefill: {
      name: `Recipient number ${i}`,
      country: ["Argentina", "España", "Francia", "Croacia"][i % 4],
      family: [
        { family_name: "Familiar Name, Reply Group 1" },
        { family_name: "Familiar Name, Reply Group 2" },
      ],
    },
  }));

  const response = await request<{ taskId: string }>(`/templates/${templateId}/send`, {
    method: "POST",
    body,
  });

  console.log(response);
  console.time("taskProgress");
  let taskStatus = await request<{ id: string; status: string; progress: number; output: any }>(
    `/tasks/${response.taskId}/status`,
    { method: "GET" },
  );

  while (taskStatus.progress < 1) {
    await wait(2_000);
    taskStatus = await request(`/tasks/${response.taskId}/status`, { method: "GET" });
    console.log(`Task ${taskStatus.id} is ${taskStatus.progress * 100}% complete`);
  }
  console.timeEnd("taskProgress");
  console.log("OUTPUT:", taskStatus.output);
}

run(main);
