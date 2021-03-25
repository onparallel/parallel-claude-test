import { toHtml, toPlainText } from "../slate";

const rootNode = (...children: string[]) => children.join("");
const paragraph = (...children: string[]) =>
  `<p style="margin:0">${children.join("")}</p>`;
const bulletList = (...children: string[]) =>
  `<ul style="margin:0;margin-left:24px;padding-left:0">${children.join(
    ""
  )}</ul>`;
const listItem = (...children: string[]) =>
  `<li style="margin-left:0">${children.join("")}</li>`;

describe("Slate", () => {
  describe("toHTML", () => {
    it("one paragraph", () => {
      expect(
        toHtml([
          {
            children: [
              {
                text: "Hello World!",
              },
            ],
          },
        ])
      ).toEqual(rootNode(paragraph("<span>Hello World!</span>")));
    });

    it("two paragraphs", () => {
      expect(
        toHtml([
          {
            type: "paragraph",
            children: [
              {
                text: "Hello World!",
              },
            ],
          },
          {
            type: "paragraph",
            children: [
              {
                text: "Goodbye.",
              },
            ],
          },
        ])
      ).toEqual(
        rootNode(
          paragraph("<span>Hello World!</span>"),
          paragraph("<span>Goodbye.</span>")
        )
      );
    });

    it("with bold text", () => {
      expect(
        toHtml([
          {
            children: [
              {
                text: "Hello",
                bold: true,
              },
              { text: "World!" },
            ],
          },
        ])
      ).toEqual(
        rootNode(
          paragraph(
            '<span style="font-weight:bold">Hello</span>',
            "<span>World!</span>"
          )
        )
      );
    });

    it("bulleted list", () => {
      expect(
        toHtml([
          {
            type: "bulleted-list",
            children: [
              {
                type: "list-item",
                children: [
                  {
                    type: "paragraph",
                    children: [{ text: "item 1" }],
                  },
                ],
              },
              {
                type: "list-item",
                children: [
                  {
                    type: "paragraph",
                    children: [{ text: "item 2" }],
                  },
                ],
              },
            ],
          },
        ])
      ).toEqual(
        rootNode(
          bulletList(
            listItem(paragraph("<span>item 1</span>")),
            listItem(paragraph("<span>item 2</span>"))
          )
        )
      );
    });

    it("message with rich content and placeholders", () => {
      expect(
        toHtml(
          [
            {
              children: [
                { text: "hola " },
                {
                  type: "placeholder",
                  placeholder: "contact-first-name",
                  children: [{ text: "" }],
                },
                { text: ", enviame los " },
                { text: "documentos " },
                { text: "siguientes ", bold: true },
                { text: "super guays", bold: true, underline: true },
              ],
            },
            {
              children: [{ text: "hmmm" }],
            },
            {
              type: "bulleted-list",
              children: [
                {
                  children: [
                    {
                      type: "paragraph",
                      children: [{ text: "foto", bold: true, underline: true }],
                    },
                  ],
                  type: "list-item",
                },
                {
                  children: [
                    {
                      type: "paragraph",
                      children: [{ text: "pasaporte", italic: true }],
                    },
                    {
                      type: "bulleted-list",
                      children: [
                        {
                          children: [
                            {
                              type: "paragraph",
                              children: [
                                {
                                  text: "foto",
                                  bold: true,
                                  underline: true,
                                },
                              ],
                            },
                          ],
                          type: "list-item",
                        },
                        {
                          children: [
                            {
                              type: "paragraph",
                              children: [{ text: "pasaporte", italic: true }],
                            },
                          ],
                          type: "list-item",
                        },
                      ],
                    },
                  ],
                  type: "list-item",
                },
              ],
            },
          ],
          { contact: { first_name: "Mariano" } }
        )
      ).toEqual(
        rootNode(
          paragraph(
            "<span>hola </span>",
            "<span>Mariano</span>",
            "<span>, enviame los </span>",
            "<span>documentos </span>",
            '<span style="font-weight:bold">siguientes </span>',
            '<span style="font-weight:bold;text-decoration:underline">super guays</span>'
          ),
          paragraph("<span>hmmm</span>"),
          bulletList(
            listItem(
              paragraph(
                '<span style="font-weight:bold;text-decoration:underline">foto</span>'
              )
            ),
            listItem(
              paragraph('<span style="font-style:italic">pasaporte</span>'),
              bulletList(
                listItem(
                  paragraph(
                    '<span style="font-weight:bold;text-decoration:underline">foto</span>'
                  )
                ),
                listItem(
                  paragraph('<span style="font-style:italic">pasaporte</span>')
                )
              )
            )
          )
        )
      );
    });

    it("escapes HTML passed as text", () => {
      expect(
        toHtml([
          {
            type: "paragraph",
            children: [
              { text: '<div style="color:red">im a malicious script!</div>' },
            ],
          },
        ])
      ).toEqual(
        rootNode(
          paragraph(
            "<span>&lt;div style=&quot;color:red&quot;&gt;im a malicious script!&lt;/div&gt;</span>"
          )
        )
      );
    });

    it("adds the right amount of whitespace", () => {
      expect(
        toHtml([
          {
            type: "paragraph",
            children: [{ text: "hola que  tal   estas?" }],
          },
        ])
      ).toEqual(
        rootNode(
          paragraph("<span>hola que &nbsp;tal &nbsp;&nbsp;estas?</span>")
        )
      );
    });
  });

  describe("toPlainText", () => {
    it("two paragraphs", () => {
      expect(
        toPlainText([
          {
            type: "paragraph",
            children: [
              {
                text: "Hello World!",
              },
            ],
          },
          {
            type: "paragraph",
            children: [
              {
                text: "Goodbye.",
              },
            ],
          },
        ])
      ).toEqual("Hello World!\nGoodbye.");
    });
  });
});
