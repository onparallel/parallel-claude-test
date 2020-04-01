import express from "express";
import { createServer } from "livereload";
import { render } from "mjml-react";
import path from "path";
import React from "react";
import { IntlProvider } from "react-intl";
import { promises as fs } from "fs";

const app = express();

const LR_SCRIPT = `<script src="http://localhost:35729/livereload.js?snipver=1"></script>`;

app.get("/favicon.ico", (req, res, next) => {
  res.send("");
});

app.get("/", async (req, res, next) => {
  const files = await fs.readdir("./emails");
  res.send(`
    <ul>
      ${files
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => `<li><a href="/${f.replace(/\.tsx$/, "")}">${f}</a></li>`)
        .join("")}
    </ul>
  `);
});

app.get("/:email", async (req, res, next) => {
  try {
    const email = req.params.email;
    const locale = req.query.lang ?? "en";
    const componentFile = path.join(__dirname, `emails/${email}.tsx`);
    const messagesFile = path.join(__dirname, `lang/compiled/${locale}.json`);
    for (const entry of Object.keys(require.cache)) {
      if (
        ["components", "emails", "lang", "utils"].some((path) =>
          entry.startsWith(`${__dirname}/${path}`)
        )
      ) {
        delete require.cache[entry];
      }
    }
    const { default: Component, props } = await import(componentFile);
    const messages = await import(messagesFile);
    const { html } = render(
      <IntlProvider locale={locale} messages={messages}>
        <Component {...props} />
      </IntlProvider>,
      {
        keepComments: true,
        beautify: true,
        minify: false,
        validationLevel: "soft",
      }
    );
    res.send(html.replace(/<\/body>/, LR_SCRIPT + "\n</body>"));
  } catch (error) {
    console.log(">>>>", error);
    res.status(500).send(error);
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`ready on http://localhost:${port}`);
});

const lr = createServer({
  exts: ["tsx", "ts", "jsx", "js", "json"],
});

lr.watch([
  __dirname + "/components",
  __dirname + "/emails",
  __dirname + "/lang",
  __dirname + "/utils",
]);
