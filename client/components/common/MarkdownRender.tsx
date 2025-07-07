import { Center, Heading, Image, Table, Tbody, Td, Th, Thead, Tr, chakra } from "@chakra-ui/react";
import { Lexer, Tokens } from "@onparallel/marked-do-not-use";
import { Fragment, memo, useMemo } from "react";
import { times, zip } from "remeda";
import { BreakLines } from "./BreakLines";
import { Divider } from "./Divider";
import { NormalLink } from "./Link";
import { ScrollShadows } from "./ScrollShadows";

interface MarkdownRender {
  markdown: string;
}

export const MarkdownRender = memo(({ markdown }: { markdown: string }) => {
  /**
   * We use a heavily customized version of markedjs where we have removed features like code, blocks, html, etc.
   */
  const tokens = useMemo(() => Lexer.lex(markdown), [markdown]);
  return (
    <>
      {tokens.map((t, i) =>
        t.type === "heading" ? (
          <Fragment key={i}>
            <Heading size={t.depth === 1 ? "md" : "sm"} marginBottom={2}>
              <MdInlineContent tokens={t.tokens as any} />
            </Heading>
            <TrailingNewLines raw={t.raw} />
          </Fragment>
        ) : t.type === "paragraph" ? (
          t.tokens && t.tokens.length === 1 && t.tokens[0].type === "image" ? (
            <Center key={i}>
              <Image alt={t.tokens[0].text} src={t.tokens[0].href} width="75%" />
            </Center>
          ) : (
            <chakra.p key={i}>
              <MdInlineContent tokens={t.tokens as any} />
            </chakra.p>
          )
        ) : t.type === "list" ? (
          <MdList key={i} token={t as Tokens.List} />
        ) : t.type === "hr" ? (
          <Fragment key={i}>
            <Divider />
            <TrailingNewLines raw={t.raw} />
          </Fragment>
        ) : t.type === "table" ? (
          <Fragment key={i}>
            <MdTable token={t as Tokens.Table} />
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
        ),
      )}
    </>
  );
});

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
  | Tokens.HTML
  | Tokens.Text
  | Tokens.Link
  | Tokens.Codespan
  | Tokens.Strong
  | Tokens.Em
  | Tokens.Del
  | Tokens.Space
  | Tokens.Image;

function MdTable({ token }: { token: Tokens.Table }) {
  return (
    <ScrollShadows overflowX="auto" direction="horizontal">
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
    </ScrollShadows>
  );
}

function MdList({ token }: { token: Tokens.List }) {
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
              <MdList key={i} token={t as Tokens.List} />
            ) : t.type === "text" || t.type === "paragraph" ? (
              <MdInlineContent key={i} tokens={(t as any).tokens} />
            ) : t.type === "space" ? (
              <chakra.span key={i}>{t.raw}</chakra.span>
            ) : process.env.NODE_ENV === "production" ? null : (
              <pre>{JSON.stringify(t)}</pre>
            ),
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
    <NormalLink href={token.href} isExternal textDecoration="underline">
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
