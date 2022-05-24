import {
  Box,
  Center,
  chakra,
  Heading,
  Image,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import type { marked } from "@onparallel/marked-do-not-use";
import { Lexer } from "@onparallel/marked-do-not-use";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useLiquid } from "@parallel/utils/useLiquid";
import { Fragment, useMemo } from "react";
import { times, zip } from "remeda";
import { BreakLines } from "./BreakLines";
import { Divider } from "./Divider";
import { NormalLink } from "./Link";

export const FieldDescription = chakraForwardRef<"div", { description?: string }>(
  function FieldDescription({ description, ...props }, ref) {
    const interpolated = useLiquid(description ?? "");
    /**
     * We use a heavily customized version of markedjs where we have removed features like code, blocks, html, etc.
     */
    const tokens = useMemo(() => Lexer.lex(interpolated), [interpolated]);
    return (
      <Box ref={ref} whiteSpace="pre-wrap" {...props}>
        {tokens.map((t, i) =>
          t.type === "heading" ? (
            <Fragment key={i}>
              <Heading size={t.depth === 1 ? "md" : "sm"} marginBottom={2}>
                <MdInlineContent tokens={t.tokens as any} />
              </Heading>
              <TrailingNewLines raw={t.raw} />
            </Fragment>
          ) : t.type === "paragraph" ? (
            t.tokens.length === 1 && t.tokens[0].type === "image" ? (
              <Center key={i}>
                <Image alt={t.tokens[0].text} src={t.tokens[0].href} width="75%" />
              </Center>
            ) : (
              <chakra.p key={i}>
                <MdInlineContent tokens={t.tokens as any} />
              </chakra.p>
            )
          ) : t.type === "list" ? (
            <MdList key={i} token={t} />
          ) : t.type === "hr" ? (
            <Fragment key={i}>
              <Divider />
              <TrailingNewLines raw={t.raw} />
            </Fragment>
          ) : t.type === "table" ? (
            <Fragment key={i}>
              <MdTable token={t} />
              <TrailingNewLines raw={t.raw} />
            </Fragment>
          ) : t.type === "space" ? (
            <chakra.p key={i}>
              {times((t.raw.match(/\n/g)?.length ?? 1) - 1, (i) => (
                <br key={i} />
              ))}
            </chakra.p>
          ) : process.env.NODE_ENV === "production" ? null : (
            <pre>{JSON.stringify(t, null, "  ")}</pre>
          )
        )}
      </Box>
    );
  }
);

function TrailingNewLines({ raw }: { raw: string }) {
  const newLines = raw.match(/\n+$/)?.[0].match(/\n/g)?.length ?? 1;
  return newLines === 1 ? null : (
    <chakra.p>
      {times(newLines - 1, (i) => (
        <br key={i} />
      ))}
    </chakra.p>
  );
}

type InlineToken =
  | marked.Tokens.HTML
  | marked.Tokens.Text
  | marked.Tokens.Link
  | marked.Tokens.Codespan
  | marked.Tokens.Strong
  | marked.Tokens.Em
  | marked.Tokens.Del
  | marked.Tokens.Space
  | marked.Tokens.Image;

function MdTable({ token }: { token: marked.Tokens.Table }) {
  return (
    <Table size="sm">
      <Thead>
        <Tr>
          {zip(token.header, token.align).map(([header, align], i) => (
            <Th key={i} width="1%" textAlign={align ?? undefined}>
              <MdInlineContent tokens={header.tokens as any} />
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {token.rows.map((row, i) => (
          <Tr key={i}>
            {zip(row, token.align).map(([cell, align], i) => (
              <Td key={i} textAlign={align ?? undefined}>
                <MdInlineContent tokens={cell.tokens as any} />
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}

function MdList({ token }: { token: marked.Tokens.List }) {
  return (
    <chakra.div
      as={token.ordered ? "ol" : "ul"}
      paddingStart={8}
      {...({ start: token.start } as any)}
    >
      {token.items.map((t, i) => (
        <chakra.li key={i}>
          {t.tokens.map((t, i) =>
            t.type === "list" ? (
              <MdList key={i} token={t} />
            ) : t.type === "text" ? (
              <MdInlineContent key={i} tokens={(t as any).tokens} />
            ) : t.type === "space" ? (
              <chakra.span key={i}>{t.raw}</chakra.span>
            ) : process.env.NODE_ENV === "production" ? null : (
              <pre>{JSON.stringify(t)}</pre>
            )
          )}
        </chakra.li>
      ))}
    </chakra.div>
  );
}

function MdInlineContent({ tokens }: { tokens: InlineToken[] }) {
  return (
    <>
      {tokens.map((t, i) => (
        <MdInline key={i} token={t} />
      ))}
    </>
  );
}

function MdInline({ token }: { token: InlineToken }) {
  if (token.type === "space") {
    return <chakra.span>{token.raw}</chakra.span>;
  }
  const content =
    "tokens" in token && token.tokens !== undefined ? (
      token.tokens.map((t, i) => <MdInline key={i} token={t as any} />)
    ) : (
      <BreakLines>{unescape(token.text)}</BreakLines>
    );
  return token.type === "strong" ? (
    <chakra.strong>{content}</chakra.strong>
  ) : token.type === "em" ? (
    <chakra.em>{content}</chakra.em>
  ) : token.type === "del" ? (
    <chakra.del>{content}</chakra.del>
  ) : token.type === "link" ? (
    <NormalLink href={token.href} isExternal>
      {content}
    </NormalLink>
  ) : token.type === "text" ? (
    <chakra.span>{content}</chakra.span>
  ) : null;
}

const characters = Object.entries({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
});

function unescape(text: string) {
  for (const [char, escaped] of characters) {
    text = text.replaceAll(escaped, char);
  }
  return text;
}
