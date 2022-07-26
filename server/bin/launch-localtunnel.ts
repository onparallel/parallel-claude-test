import { writeFileSync } from "fs";
import localtunnel from "localtunnel";
import { connect } from "ngrok";
import { resolve } from "path";
import yargs from "yargs";

(async () => {
  const opts = await yargs.option("ngrok", {
    required: false,
    type: "boolean",
    description: "force using ngrok as tunnel server",
  }).argv;

  let url = "";
  let useNgrok = opts.ngrok ?? false;

  if (!useNgrok) {
    try {
      url = await withTimeout(
        localtunnel({
          port: 4000,
          subdomain: "parallel-localtunnel-dev", // try to use this custom subdomain, so restarts of the tunnel may keep the connection alive with 3rd party APIs
        }).then((t) => t.url),
        10000
      );
    } catch {
      console.log("localtunnel offline, trying with ngrok...");
      useNgrok = true;
    }
  }

  if (useNgrok) {
    url = await connect({ proto: "http", addr: 4000 });
    console.log("Inspect webhook on: http://127.0.0.1:4040/");
  }

  console.log("Your tunnel URL is:", url);

  writeFileSync(resolve(__dirname, "localtunnel-dev.url"), url, "utf8");
})();

async function withTimeout<T>(fn: Promise<T>, timeout: number) {
  return await Promise.race([new Promise<T>((_, rejected) => setTimeout(rejected, timeout)), fn]);
}
