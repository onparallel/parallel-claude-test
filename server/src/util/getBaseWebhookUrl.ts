import { readFileSync } from "fs";
import { resolve } from "path";
import { waitFor } from "./promises/waitFor";

export async function getBaseWebhookUrl(defaultURL: string) {
  return process.env.NODE_ENV === "production" ? defaultURL : await tunnelUrl();
}

async function tunnelUrl() {
  try {
    const tunnelUrl = readFileSync(resolve("./bin/localtunnel-dev.url"), {
      encoding: "utf-8",
    });

    // ping the api to make sure tunnel is active.
    await Promise.race([
      fetch(`${tunnelUrl}/ping`).then((res) => {
        if (!res.ok) {
          Promise.reject(
            new Error(
              `Tunnel at ${tunnelUrl} seems to be down with code ${res.status}. Run 'yarn localtunnel' on a separate terminal and try again.`,
            ),
          );
        }
      }),
      waitFor(5_000).then(() => Promise.reject(new Error("TIMEOUT"))),
    ]);
    return tunnelUrl;
  } catch (e: any) {
    if (e.code === "ENOENT") {
      throw new Error(
        `localtunnel-dev.url file not found at path ${e.path}. Run 'yarn localtunnel' on a separate terminal and try again.`,
      );
    } else {
      throw e;
    }
  }
}
