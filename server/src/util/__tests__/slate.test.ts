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
