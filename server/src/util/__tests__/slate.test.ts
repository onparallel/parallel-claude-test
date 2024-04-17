import { outdent } from "outdent";
import { toGlobalId } from "../globalId";
import { renderSlateWithPlaceholdersToHtml } from "../slate/placeholders";
import { renderSlateToHtml, renderSlateToText } from "../slate/render";
import { fromPlainTextWithMentions } from "../slate/utils";

const rootNode = (...children: string[]) => children.join("");
const paragraph = (...children: string[]) => `<p style="margin:0">${children.join("")}</p>`;
const bulletList = (...children: string[]) =>
  `<ul style="margin:0;margin-left:24px;padding-left:0">${children.join("")}</ul>`;
const listItem = (...children: string[]) => `<li style="margin-left:0">${children.join("")}</li>`;

describe("slate/render", () => {
  describe("renderSlateToHtml", () => {
    it("one paragraph", () => {
      expect(
        renderSlateToHtml([
          {
            children: [{ text: "Hello World!" }],
          },
        ]),
      ).toEqual(rootNode(paragraph("<span>Hello World!</span>")));
    });

    it("two paragraphs", () => {
      expect(
        renderSlateToHtml([
          { type: "paragraph", children: [{ text: "Hello World!" }] },
          { type: "paragraph", children: [{ text: "Goodbye." }] },
        ]),
      ).toEqual(
        rootNode(paragraph("<span>Hello World!</span>"), paragraph("<span>Goodbye.</span>")),
      );
    });

    it("with bold text", () => {
      expect(
        renderSlateToHtml([
          {
            children: [{ text: "Hello", bold: true }, { text: "World!" }],
          },
        ]),
      ).toEqual(
        rootNode(paragraph('<span style="font-weight:bold">Hello</span>', "<span>World!</span>")),
      );
    });

    it("old style bulleted list", () => {
      // first child on list-item used to be a paragraph
      expect(
        renderSlateToHtml([
          {
            type: "bulleted-list",
            children: [
              {
                type: "list-item",
                children: [{ type: "paragraph", children: [{ text: "item 1" }] }],
              },
              {
                type: "list-item",
                children: [{ type: "paragraph", children: [{ text: "item 2" }] }],
              },
            ],
          },
        ]),
      ).toEqual(
        rootNode(
          bulletList(
            listItem(paragraph("<span>item 1</span>")),
            listItem(paragraph("<span>item 2</span>")),
          ),
        ),
      );
    });

    it("bulleted list", () => {
      expect(
        renderSlateToHtml([
          {
            type: "bulleted-list",
            children: [
              {
                type: "list-item",
                children: [{ type: "list-item-child", children: [{ text: "item 1" }] }],
              },
              {
                type: "list-item",
                children: [{ type: "list-item-child", children: [{ text: "item 2" }] }],
              },
            ],
          },
        ]),
      ).toEqual(
        rootNode(
          bulletList(
            listItem(paragraph("<span>item 1</span>")),
            listItem(paragraph("<span>item 2</span>")),
          ),
        ),
      );
    });

    it("escapes HTML passed as text", () => {
      expect(
        renderSlateToHtml([
          {
            type: "paragraph",
            children: [{ text: '<div style="color:red">im a malicious script!</div>' }],
          },
        ]),
      ).toEqual(
        rootNode(
          paragraph(
            "<span>&lt;div style=&quot;color:red&quot;&gt;im a malicious script!&lt;/div&gt;</span>",
          ),
        ),
      );
    });

    it("adds the right amount of whitespace", () => {
      expect(
        renderSlateToHtml([
          {
            type: "paragraph",
            children: [{ text: "hola que  tal   estas?" }],
          },
        ]),
      ).toEqual(rootNode(paragraph("<span>hola que &nbsp;tal &nbsp;&nbsp;estas?</span>")));
    });
  });

  describe("renderSlateToText", () => {
    it("two paragraphs", () => {
      expect(
        renderSlateToText([
          { type: "paragraph", children: [{ text: "Hello World!" }] },
          { type: "paragraph", children: [{ text: "Goodbye." }] },
        ]),
      ).toEqual(outdent`
        Hello World!
        Goodbye.
      `);
    });

    it("old style bulleted list", () => {
      // first child on list-item used to be a paragraph
      expect(
        renderSlateToText([
          { type: "paragraph", children: [{ text: "Hello World!" }] },
          {
            type: "bulleted-list",
            children: [
              {
                type: "list-item",
                children: [{ type: "paragraph", children: [{ text: "item 1" }] }],
              },
              {
                type: "list-item",
                children: [{ type: "paragraph", children: [{ text: "item 2" }] }],
              },
            ],
          },
        ]),
      ).toEqual(outdent`
        Hello World!
          - item 1
          - item 2
      `);
    });

    it("bulleted list", () => {
      expect(
        renderSlateToText([
          { type: "paragraph", children: [{ text: "Hello World!" }] },
          {
            type: "bulleted-list",
            children: [
              {
                type: "list-item",
                children: [{ type: "list-item-child", children: [{ text: "item 1" }] }],
              },
              {
                type: "list-item",
                children: [{ type: "list-item-child", children: [{ text: "item 2" }] }],
              },
            ],
          },
        ]),
      ).toEqual(outdent`
        Hello World!
          - item 1
          - item 2
      `);
    });

    it("nested unordered lists", () => {
      expect(
        renderSlateToText([
          { type: "paragraph", children: [{ text: "Hello World!" }] },
          {
            type: "bulleted-list",
            children: [
              {
                type: "list-item",
                children: [
                  { type: "list-item-child", children: [{ text: "item 1" }] },
                  {
                    type: "bulleted-list",
                    children: [
                      {
                        type: "list-item",
                        children: [{ type: "list-item-child", children: [{ text: "item 1.1" }] }],
                      },
                      {
                        type: "list-item",
                        children: [
                          { type: "list-item-child", children: [{ text: "item 1.2" }] },
                          {
                            type: "bulleted-list",
                            children: [
                              {
                                type: "list-item",
                                children: [
                                  { type: "list-item-child", children: [{ text: "item 1.2.1" }] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "list-item",
                children: [{ type: "paragraph", children: [{ text: "item 2" }] }],
              },
            ],
          },
        ]),
      ).toEqual(outdent`
        Hello World!
          - item 1
            - item 1.1
            - item 1.2
              - item 1.2.1
          - item 2
      `);
    });

    it("nested ordered lists", () => {
      expect(
        renderSlateToText([
          { type: "paragraph", children: [{ text: "Hello World!" }] },
          {
            type: "numbered-list",
            children: [
              {
                type: "list-item",
                children: [
                  { type: "list-item-child", children: [{ text: "item 1" }] },
                  {
                    type: "numbered-list",
                    children: [
                      {
                        type: "list-item",
                        children: [{ type: "list-item-child", children: [{ text: "item 1.1" }] }],
                      },
                      {
                        type: "list-item",
                        children: [
                          { type: "list-item-child", children: [{ text: "item 1.2" }] },
                          {
                            type: "numbered-list",
                            children: [
                              {
                                type: "list-item",
                                children: [
                                  { type: "list-item-child", children: [{ text: "item 1.2.1" }] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "list-item",
                children: [{ type: "paragraph", children: [{ text: "item 2" }] }],
              },
            ],
          },
        ]),
      ).toEqual(outdent`
        Hello World!
          1. item 1
            1. item 1.1
            2. item 1.2
              1. item 1.2.1
          2. item 2
      `);
    });
  });
});

describe("slate/placeholders", () => {
  describe("renderSlateWithPlaceholdersToHtml", () => {
    it("message with rich content and placeholders", () => {
      expect(
        renderSlateWithPlaceholdersToHtml(
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
                              children: [{ text: "foto", bold: true, underline: true }],
                            },
                          ],
                          type: "list-item",
                        },
                        {
                          children: [
                            { type: "paragraph", children: [{ text: "pasaporte", italic: true }] },
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
          (placeholder) => {
            if (placeholder === "contact-first-name") {
              return "Mariano";
            }
            return "";
          },
        ),
      ).toEqual(
        rootNode(
          paragraph(
            "<span>hola </span>",
            "<span>Mariano</span>",
            "<span>, enviame los </span>",
            "<span>documentos </span>",
            '<span style="font-weight:bold">siguientes </span>',
            '<span style="font-weight:bold;text-decoration:underline">super guays</span>',
          ),
          paragraph("<span>hmmm</span>"),
          bulletList(
            listItem(
              paragraph('<span style="font-weight:bold;text-decoration:underline">foto</span>'),
            ),
            listItem(
              paragraph('<span style="font-style:italic">pasaporte</span>'),
              bulletList(
                listItem(
                  paragraph('<span style="font-weight:bold;text-decoration:underline">foto</span>'),
                ),
                listItem(paragraph('<span style="font-style:italic">pasaporte</span>')),
              ),
            ),
          ),
        ),
      );
    });
  });
});

describe("slate/utils", () => {
  describe("fromPlainTextWithMentions", () => {
    async function mentionResolver(mention: string): Promise<{ id: string; name: string }> {
      if (mention === "@[id:12345]") {
        return {
          id: "12345",
          name: "John Doe",
        };
      } else if (mention === "@[id:6789]") {
        return {
          id: "6789",
          name: "Harvey Specter",
        };
      } else if (mention === "@[group:Developers]") {
        return {
          id: toGlobalId("UserGroup", 1),
          name: "Developers",
        };
      } else if (mention === "@[email:mike@onparallel.com]") {
        return {
          id: toGlobalId("User", 1),
          name: "Mike Ross",
        };
      }
      throw new Error(`Unknown mention ${mention}`);
    }

    it("simple multiline text to slate", async () => {
      expect(await fromPlainTextWithMentions(`Hello\nWorld!`, mentionResolver)).toEqual([
        { type: "paragraph", children: [{ text: "Hello" }] },
        { type: "paragraph", children: [{ text: "World!" }] },
      ]);
    });

    it("plain text with user id mention", async () => {
      expect(
        await fromPlainTextWithMentions("Hello @[id:12345] please fill this form", mentionResolver),
      ).toEqual([
        {
          type: "paragraph",
          children: [
            {
              text: "Hello ",
            },
            {
              type: "mention",
              mention: "12345",
              children: [{ text: "John Doe" }],
            },
            {
              text: " please fill this form",
            },
          ],
        },
      ]);
    });

    it("plain text with group mention", async () => {
      expect(
        await fromPlainTextWithMentions(
          "Hello @[group:Developers] please fill this form",
          mentionResolver,
        ),
      ).toEqual([
        {
          type: "paragraph",
          children: [
            {
              text: "Hello ",
            },
            {
              type: "mention",
              mention: toGlobalId("UserGroup", 1),
              children: [{ text: "Developers" }],
            },
            {
              text: " please fill this form",
            },
          ],
        },
      ]);
    });

    it("plain text with email mention", async () => {
      expect(
        await fromPlainTextWithMentions(
          "Hello @[email:mike@onparallel.com] please fill this form",
          mentionResolver,
        ),
      ).toEqual([
        {
          type: "paragraph",
          children: [
            {
              text: "Hello ",
            },
            {
              type: "mention",
              mention: toGlobalId("User", 1),
              children: [{ text: "Mike Ross" }],
            },
            {
              text: " please fill this form",
            },
          ],
        },
      ]);
    });

    it("plain text with unknown mention", async () => {
      await expect(
        fromPlainTextWithMentions("Hello @[id:unknown] please fill this form", mentionResolver),
      ).rejects.toThrow("Unknown mention @[id:unknown]");
    });

    it("multiline plain text with mentions and urls", async () => {
      expect(
        await fromPlainTextWithMentions(
          "Hello @[email:mike@onparallel.com]please fill this form\n" +
            "and visit https://onparallel.com\n" +
            "then go tell @[group:Developers] and @[id:12345] to do the same",
          mentionResolver,
        ),
      ).toEqual([
        {
          type: "paragraph",
          children: [
            { text: "Hello " },
            {
              type: "mention",
              mention: toGlobalId("User", 1),
              children: [{ text: "Mike Ross" }],
            },
            { text: "please fill this form" },
          ],
        },
        {
          type: "paragraph",
          children: [
            { text: "and visit " },
            {
              type: "link",
              url: "https://onparallel.com",
              children: [{ text: "https://onparallel.com" }],
            },
            { text: "" },
          ],
        },
        {
          type: "paragraph",
          children: [
            { text: "then go tell " },
            {
              type: "mention",
              mention: toGlobalId("UserGroup", 1),
              children: [{ text: "Developers" }],
            },
            {
              text: " and ",
            },
            {
              type: "mention",
              mention: "12345",
              children: [{ text: "John Doe" }],
            },
            { text: " to do the same" },
          ],
        },
      ]);
    });

    it("mentions and urls must contain word boundaries at start", async () => {
      expect(
        await fromPlainTextWithMentions(
          "hi@[email:mike@onparallel.com]this is my pagehttps://onparallel.com",
          mentionResolver,
        ),
      ).toEqual([
        {
          type: "paragraph",
          children: [
            { text: "hi@[email:mike@onparallel.com]this is my pagehttps://onparallel.com" },
          ],
        },
      ]);
    });

    it('ignores anything before "|" on a mention', async () => {
      expect(
        await fromPlainTextWithMentions("hello @[John Doe|id:12345]!", mentionResolver),
      ).toEqual([
        {
          type: "paragraph",
          children: [
            { text: "hello " },
            {
              type: "mention",
              mention: "12345",
              children: [{ text: "John Doe" }],
            },
            { text: "!" },
          ],
        },
      ]);
    });

    it("parses more than one mention with names on the same line", async () => {
      expect(
        await fromPlainTextWithMentions(
          "hi @[John|id:12345] and @[Harvey|id:6789]",
          mentionResolver,
        ),
      ).toEqual([
        {
          type: "paragraph",
          children: [
            { text: "hi " },
            {
              type: "mention",
              mention: "12345",
              children: [{ text: "John Doe" }],
            },
            { text: " and " },
            {
              type: "mention",
              mention: "6789",
              children: [{ text: "Harvey Specter" }],
            },
            {
              text: "",
            },
          ],
        },
      ]);
    });
  });
});
