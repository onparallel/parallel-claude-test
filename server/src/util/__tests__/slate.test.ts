import { toHtml, toPlainText } from "../slate";

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
      ).toEqual("<p><span>Hello World!</span></p>");
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
      ).toEqual("<p><span>Hello World!</span></p><p><span>Goodbye.</span></p>");
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
        '<p><span style="font-weight:bold;">Hello</span><span>World!</span></p>'
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
        '<ul style="padding-left:24px"><li><p><span>item 1</span></p></li><li><p><span>item 2</span></p></li></ul>'
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
                  placeholder: "contactName",
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
          { contactName: "Mariano" }
        )
      ).toEqual(
        // first paragraph
        "<p>" +
          "<span>hola </span>" +
          "<span>Mariano</span>" +
          "<span>, enviame los </span>" +
          "<span>documentos </span>" +
          '<span style="font-weight:bold;">siguientes </span>' +
          '<span style="font-weight:bold;text-decoration:underline;">super guays</span>' +
          "</p>" +
          // second paragraph
          "<p><span>hmmm</span></p>" +
          // bullet list
          '<ul style="padding-left:24px">' +
          '<li><p><span style="font-weight:bold;text-decoration:underline;">foto</span></p></li>' +
          "<li>" +
          '<p><span style="font-style:italic;">pasaporte</span></p>' +
          '<ul style="padding-left:24px">' +
          '<li><p><span style="font-weight:bold;text-decoration:underline;">foto</span></p></li>' +
          '<li><p><span style="font-style:italic;">pasaporte</span></p></li>' +
          "</ul>" +
          "</li>" +
          "</ul>"
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
        "<p><span>&lt;div style=&quot;color:red&quot;&gt;im a malicious script!&lt;/div&gt;</span></p>"
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
