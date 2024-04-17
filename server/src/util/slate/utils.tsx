import { isDefined } from "remeda";
import { SlateNode } from "./render";
import pMap from "p-map";

// @[id:12345]
// @[group:Developers]
// @[email:user@onparallel.com]
// @[John Doe|id:12345]
const MENTION_REGEX = /\B(@\[(?:(?:\\\||[^|])+\|)?(?:id|group|email):(?:[^\]]+?)\])/g;

// https://www.google.com
const HTTPS_REGEX = /\b(https?:\/\/[^\s]+)/g;

export function paragraphIsEmpty(node: SlateNode) {
  return node?.children?.length === 1 && node.children[0]?.text === "";
}

export function isEmptyRTEValue(value: SlateNode[]) {
  return value.length === 1 && paragraphIsEmpty(value[0]);
}

export function fromPlainText(value: string): SlateNode[] {
  return value.split("\n").map((line) => ({ type: "paragraph", children: [{ text: line }] }));
}

export async function fromPlainTextWithMentions(
  value: string,
  mentionResolver: (mention: string) => Promise<{ id: string; name: string }>,
): Promise<SlateNode[]> {
  return await pMap(
    value.split("\n"),
    async (line) => {
      let parts = [line];

      for (const regex of [MENTION_REGEX, HTTPS_REGEX]) {
        parts = parts.flatMap((p) => p.split(regex));
      }

      const children: SlateNode[] = [];

      for (const part of parts) {
        if (part.match(MENTION_REGEX)) {
          // remove everything between "@[" and "|" if it exists
          const mention = await mentionResolver(part.replace(/@\[(?:(?:\\\||[^|])+\|)/, "@["));
          children.push({
            type: "mention",
            mention: mention.id,
            children: [{ text: mention.name }],
          });
        } else if (part.match(HTTPS_REGEX)) {
          children.push({ type: "link", url: part, children: [{ text: part }] });
        } else {
          children.push({ text: part });
        }
      }

      return { type: "paragraph" as const, children };
    },
    { concurrency: 1 },
  );
}

export function emptyRTEValue(): SlateNode[] {
  return [{ type: "paragraph", children: [{ text: "" }] }];
}

export function walkSlateNodes(
  nodes: SlateNode[],
  visit: (input: SlateNode) => SlateNode | void,
): SlateNode[] {
  return nodes.map((node) => {
    const result = visit(node) ?? node;
    if (isDefined(result.children)) {
      return { ...result, children: walkSlateNodes(result.children, visit) };
    }
    return result;
  });
}
