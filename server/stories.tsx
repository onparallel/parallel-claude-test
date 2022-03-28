import { renderToStream, Text } from "@react-pdf/renderer";
import Convert from "ansi-to-html";
import cors from "cors";
import escapeHTML from "escape-html";
import express, { Request } from "express";
import { createServer } from "livereload";
import { render } from "mjml-react";
import path from "path";
import { createIntl, IntlProvider } from "react-intl";
import { mapValues } from "remeda";
import { loadMessages } from "./src/util/loadMessages";

const app = express();
app.use(cors());

const LR_SCRIPT = `<script src="http://localhost:35729/livereload.js?snipver=1"></script>`;

async function parseArgs(req: Request, storyName: string) {
  const storyPath = path.join(__dirname, `src/${storyName}.stories.json`);
  const storyConfig = await import(storyPath);
  const story = storyConfig.stories.find((s: any) => s.parameters.server.id === storyName);
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
  .get("/pdf/documents/:document", async (req, res, next) => {
    const query = new URLSearchParams(req.query as any);
    const url = encodeURIComponent(
      `http://localhost:5000/pdf/documents/${req.params.document}/file.pdf?${query}`
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
  .get("/pdf/documents/:document/file.pdf", async (req, res, next) => {
    try {
      // clear cache
      for (const entry of Object.keys(require.cache)) {
        if (entry.startsWith(`${__dirname}/src`) || entry.startsWith(`${__dirname}/lang`)) {
          delete require.cache[entry];
        }
      }
      const document = req.params.document;
      const locale = req.query.locale as string;
      const { default: Component } = await import(`./src/pdf/documents/${document}.tsx`);
      const params = await parseArgs(req, req.path.replace(/^\//, "").replace("/file.pdf", ""));
      const messages = await loadMessages(locale);
      const intlProps = {
        messages,
        locale,
        defaultRichTextElements: {
          b: (chunks: any) => <Text>{chunks}</Text>,
        },
      };
      const stream = await renderToStream(
        <IntlProvider {...intlProps}>
          <Component {...params} />
        </IntlProvider>
      );
      stream.pipe(res);
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

app.get("/emails/components/:email", async (req, res, next) => {
  try {
    // clear cache
    for (const entry of Object.keys(require.cache)) {
      if (entry.startsWith(`${__dirname}/src`) || entry.startsWith(`${__dirname}/lang`)) {
        delete require.cache[entry];
      }
    }
    const email = req.params.email;
    const locale = req.query.locale as string;
    const type = req.query.type as string;
    const {
      default: { html: Component, text, subject, from },
    } = await import(`./src/emails/components/${email}.tsx`);
    const params = await parseArgs(req, req.path.replace(/^\//, ""));
    const messages = await loadMessages(locale);
    const intlProps = {
      messages,
      locale,
      defaultRichTextElements: {
        b: (chunks: any) => <strong>{chunks}</strong>,
      },
    };
    const intl = createIntl(intlProps);
    if (type === "html") {
      const { html } = render(
        <IntlProvider {...intlProps}>
          <Component {...params} />
        </IntlProvider>,
        {
          keepComments: true,
          minify: false,
          validationLevel: "soft",
        }
      );
      res.send(
        html
          .replace(
            /(<body[^>]*>)/,
            /* html */ `$1${header({
              subject: subject(params, intl),
              from: from(params, intl),
            })}`
          )
          .replace(/<\/body>/, LR_SCRIPT + "\n</body>")
      );
    } else {
      res.send(/* html */ `
        <html>
        <body>
          ${header({
            subject: subject(params, intl),
            from: from(params, intl),
          })}
          <pre>${text(params, intl)}</pre>
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

lr.watch([
  __dirname + "/src/emails/components",
  __dirname + "/src/emails/common",
  __dirname + "/src/emails/lang",
  __dirname + "/src/emails/utils",
  __dirname + "/src/pdf/documents",
]);
