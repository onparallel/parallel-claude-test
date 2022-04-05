import { Document, Page, renderToStream, Text, View } from "@react-pdf/renderer";
import Convert from "ansi-to-html";
import cors from "cors";
import { config } from "dotenv";
import escapeHTML from "escape-html";
import express, { Request } from "express";
import { GraphQLClient } from "graphql-request";
import { createServer } from "livereload";
import path from "path";
import { mapValues, pick } from "remeda";
import { buildEmail } from "./src/emails/buildEmail";
import { buildPdf } from "./src/pdf/buildPdf";

config({ path: path.resolve(process.cwd(), ".development.env") });

const app = express();
app.use(cors());

const LR_SCRIPT = `<script src="http://localhost:35729/livereload.js?snipver=1"></script>`;

async function parseArgs(req: Request, storyPath: string) {
  const storyConfig = await import(storyPath);
  const story = storyConfig.stories[0];
  return mapValues(story.argTypes, ({ control: { type } }: any, key) => {
    switch (type) {
      case "object":
        return JSON.parse(req.query[key as string] as string);
      case "boolean":
        return req.query[key as string] === "true";
      case "date":
        return new Date(req.query[key as string] as string);
      case "number":
        return parseInt(req.query[key as string] as string, 10);
      default:
        return req.query[key as string];
    }
  });
}

app
  .get("/documents/:document", async (req, res, next) => {
    const query = new URLSearchParams(req.query as any);
    const url = encodeURIComponent(
      `http://localhost:5000/documents/${req.params.document}/file.pdf?${query}`
    );
    res.send(/* html */ `
      <html>
      <body>
        <iframe id="pdf-js-viewer" src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${url}" style="position:fixed; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;"></iframe>
        ${LR_SCRIPT}
      </body>
      </html>
    `);
  })
  .get("/documents/:document/file.pdf", async (req, res, next) => {
    try {
      // clear cache
      for (const entry of Object.keys(require.cache)) {
        if (entry.startsWith(`${__dirname}/src`) || entry.startsWith(`${__dirname}/lang`)) {
          delete require.cache[entry];
        }
      }
      const document = req.params.document;
      const locale = req.query.locale as string;
      const client = new GraphQLClient("http://localhost/graphql", {
        headers: { authorization: `Bearer ${process.env.ACCESS_TOKEN}` },
      });
      const { default: Component } = await import(`./src/pdf/documents/${document}.tsx`);
      const params = await parseArgs(req, `./src/pdf/documents/${document}.stories.json`);
      (await buildPdf(Component, params, { client, locale })).pipe(res);
    } catch (error) {
      if (error instanceof Error) {
        (
          await renderToStream(
            <Document>
              <Page>
                <View>
                  <Text>{error.toString()}</Text>
                </View>
                <View>
                  <Text>{error.stack}</Text>
                </View>
              </Page>
            </Document>
          )
        ).pipe(res);
      }
    }
  });

app.get("/emails/:email", async (req, res, next) => {
  try {
    // clear cache
    for (const entry of Object.keys(require.cache)) {
      if (entry.startsWith(`${__dirname}/src`) || entry.startsWith(`${__dirname}/lang`)) {
        delete require.cache[entry];
      }
    }
    const name = req.params.email;
    const locale = req.query.locale as string;
    const type = req.query.type as string;
    const { default: email } = await import(`./src/emails/emails/${name}.tsx`);
    const params = await parseArgs(req, `./src/emails/emails/${name}.stories.json`);
    const result = await buildEmail(email, params, { locale });
    if (type === "html") {
      res.send(
        result.html
          .replace(/(<body[^>]*>)/, /* html */ `$1${header(pick(result, ["subject", "from"]))}`)
          .replace(/<\/body>/, LR_SCRIPT + "\n</body>")
      );
    } else {
      res.send(/* html */ `
        <html>
        <body>
          ${header(pick(result, ["subject", "from"]))}
          <pre>${result.text}</pre>
          ${LR_SCRIPT}
        </body>
        </html>
      `);
    }
  } catch (error: any) {
    const convert = new Convert();
    console.log(">>>>", error);
    res.status(500).send(/* html */ `
      <html>
      <body>
        <pre style="background-color: #333; color: #fff; max-width: 100vw; white-space: pre-wrap;">${convert.toHtml(
          escapeHTML(error.toString()),
          { bg: "#333", fg: "#fff" }
        )}</pre> 
        ${LR_SCRIPT}
      </body>
      </html>
    `);
  }
});

function header({ subject, from }: { subject: string; from: string }) {
  return /* html */ `
  <div style="color: #333; border: 1px solid #666; border-radius: 4px; padding: 16px; margin-bottom: 16px;">
    <h1 style="font-family: Helvetica; font-size: 16px; margin-top: 0; margin-bottom: 16px;">
      ${subject}
    </h1>
    <h2 style="font-family: Helvetica; font-size: 14px; margin: 0;">
      ${from}
    </h2>
  </div>
  `;
}

const port = process.env.EMAILS_PORT || 5000;

app.listen(port, () => {
  console.log(`ready on http://localhost:${port}`);
});

const lr = createServer({
  exts: ["tsx", "ts", "jsx", "js", "json"],
});

lr.watch([__dirname + "/src/emails", __dirname + "/src/pdf"]);
