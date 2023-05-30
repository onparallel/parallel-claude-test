import { isDefined } from "remeda";
import { fromGlobalId } from "../globalId";
import { Maybe } from "../types";
import { walkSlateNodes } from "./utils";
import { SlateNode, renderSlateToHtml, renderSlateToReactNodes, renderSlateToText } from "./render";
import { createElement } from "react";

export function collectMentionsFromSlate(value: Maybe<SlateNode[]>) {
  if (!isDefined(value)) {
    return [];
  }
  const seen: Record<string, boolean> = {};
  const mentions: { id: number; type: "User" | "UserGroup" }[] = [];
  walkSlateNodes(value, (node) => {
    if (node.type === "mention" && !seen[node.mention!]) {
      seen[node.mention!] = true;
      mentions.push(fromGlobalId<"User" | "UserGroup">(node.mention!));
    }
  });
  return mentions;
}

export function renderSlateWithMentionsToHtml(nodes: SlateNode[]) {
  return renderSlateToHtml(nodes, {
    override: {
      mention: (node) =>
        createElement(
          "mention",
          { "data-mention-id": node.mention },
          renderSlateToReactNodes(node.children!)
        ),
    },
  });
}

export function renderSlateWithMentionsToText(nodes: SlateNode[]) {
  return renderSlateToText(nodes, {
    override: {
      mention: (node) => `@${node.children![0].text}`,
    },
  });
}
