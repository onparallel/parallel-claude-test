import localtunnel from "localtunnel";
import { writeFileSync } from "fs";
import { resolve } from "path";

(async () => {
  const tunnel = await localtunnel({ port: 4000 });
  console.log(tunnel.url);
  writeFileSync(resolve(__dirname, "localtunnel-dev.url"), tunnel.url, "utf8");

  tunnel.on("close", () => {
    console.log("tunnel closed");
  });
})();
