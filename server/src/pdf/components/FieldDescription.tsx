import { marked } from "@onparallel/marked-do-not-use";
import { Image, Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Fragment, useMemo } from "react";
import { zip } from "remeda";
import { cleanupText } from "../utils/cleanupText";
import { useTheme } from "../utils/ThemeProvider";
import { useLiquid } from "../utils/useLiquid";

interface FieldDescriptionProps {
  description: string;
}

const tests: ((text: string) => boolean)[] = [
  (text) => /^ {0,3}([*+-]|\d{1,9}[.)])/g.test(text),
  (text) => text.includes("http"),
  (text) => text.includes("*"),
  (text) => text.includes("]("),
  (text) => /^ {0,3}#{1,6} /g.test(text),
  (text) => /\| ?:-/.test(text),
  (text) => text.includes("--"),
  (text) => text.includes("=="),
  (text) => text.includes("~"),
];

function detectMarkdown(text: string) {
  return tests.some((test) => test(text));
}

export function FieldDescription({ description }: FieldDescriptionProps) {
  const interpolated = useLiquid(description);
  /**
   * We use a heavily customized version of markedjs where we have removed features like code, blocks, html, etc.
   */
  const { tokens, hasMarkdown } = useMemo(() => {
    const hasMarkdown = detectMarkdown(interpolated);
    const tokens = hasMarkdown ? marked.lexer(interpolated) : null;
    return { hasMarkdown, tokens };
  }, [interpolated]);
  const theme = useTheme();
  const styles = StyleSheet.create({
    title1: {
      fontFamily: theme.title1FontFamily,
      fontSize: theme.title1FontSize,
      color: theme.title1Color,
      fontWeight: 600,
      marginBottom: "2mm",
    },
    title2: {
      fontFamily: theme.title2FontFamily,
      fontSize: theme.title2FontSize,
      color: theme.title2Color,
      fontWeight: 600,
      marginBottom: "2mm",
    },
  });
  return hasMarkdown ? (
    <View>
      {tokens!.map((t, i) =>
        t.type === "heading" ? (
          <Fragment key={i}>
            <Text key={i} style={t.depth === 1 ? styles.title1 : styles.title2}>
              <MdInlineContent tokens={t.tokens as any} />
            </Text>
            <TrailingNewLines raw={t.raw} />
          </Fragment>
        ) : t.type === "paragraph" ? (
          t.tokens.length === 1 && t.tokens[0].type === "image" ? (
            <View
              key={i}
              style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}
            >
              <Image src={t.tokens[0].href} style={{ width: "75%" }} />
            </View>
          ) : (
            <Text key={i}>
              <MdInlineContent tokens={t.tokens as any} />
            </Text>
          )
        ) : t.type === "list" ? (
          <MdList key={i} token={t} />
        ) : t.type === "table" ? (
          <Fragment key={i}>
            <MdTable token={t} />
            <TrailingNewLines raw={t.raw} />
          </Fragment>
        ) : t.type === "hr" ? (
          <Fragment key={i}>
            <View style={{ borderBottom: "1px solid #e2e8f0" }} />
            <TrailingNewLines raw={t.raw} />
          </Fragment>
        ) : t.type === "space" ? (
          <Text key={i}>{"\n".repeat((t.raw.match(/\n/g)?.length ?? 1) - 1)}</Text>
        ) : process.env.NODE_ENV === "production" ? null : (
          <View key={i}>
            <Text>{JSON.stringify(t, null, "  ")}</Text>
          </View>
        )
      )}
    </View>
  ) : (
    <Text>{cleanupText(interpolated)}</Text>
  );
}

function TrailingNewLines({ raw }: { raw: string }) {
  const newLines = raw.match(/\n+$/)?.[0].match(/\n/g)?.length ?? 1;
  return newLines === 1 ? null : <Text>{"\n".repeat(newLines - 1)}</Text>;
}

function MdTable({ token }: { token: marked.Tokens.Table }) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    tableRow: {
      display: "flex",
      flexDirection: "row",
      fontSize: theme.textFontSize * 0.75,
      borderBottom: "1px solid #e2e8f0",
    },
    tableCell: {
      flex: "1",
      paddingVertical: `${(theme.textFontSize * 1) / 12}mm`,
      paddingHorizontal: `${(theme.textFontSize * 2) / 12}mm`,
    },
    tableHeader: {
      textTransform: "uppercase",
      fontWeight: "bold",
      opacity: 0.8,
    },
  });
  return (
    <View>
      <View style={styles.tableRow}>
        {zip(token.header, token.align).map(([header, align], i) => (
          <View
            key={i}
            style={[styles.tableCell, styles.tableHeader, { textAlign: align ?? undefined }]}
          >
            <MdInlineContent tokens={header.tokens as any} />
          </View>
        ))}
      </View>
      {token.rows.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          {zip(row, token.align).map(([cell, align], i) => (
            <View key={i} style={[styles.tableCell, { textAlign: align ?? undefined }]}>
              <MdInlineContent tokens={cell.tokens as any} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function MdList({ token: token, level = 0 }: { token: marked.Tokens.List; level?: number }) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    listItemContainer: {
      display: "flex",
      flexDirection: "row",
    },
    listItemBulletContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      width: `${theme.textFontSize * 0.6}mm`,
      marginRight: `${theme.textFontSize * 0.16}mm`,
      height: `${theme.textFontSize * 0.5}mm`,
    },
    listItemBulletLevel0: {
      height: `${theme.textFontSize * 0.14}mm`,
      width: `${theme.textFontSize * 0.14}mm`,
      backgroundColor: theme.textColor,
      borderRadius: "100%",
    },
    listItemBulletLevel1: {
      height: `${theme.textFontSize * 0.14}mm`,
      width: `${theme.textFontSize * 0.14}mm`,
      borderRadius: "100%",
      border: `1px solid ${theme.textColor}`,
    },
    listItemBulletLevel2: {
      height: `${theme.textFontSize * 0.14}mm`,
      width: `${theme.textFontSize * 0.14}mm`,
      backgroundColor: theme.textColor,
    },
  });
  return (
    <View>
      {token.items.map((t, i) => (
        <View key={i} style={styles.listItemContainer}>
          <View style={styles.listItemBulletContainer}>
            {token.ordered ? (
              <Text>{`${typeof token.start === "number" ? token.start + i : i + 1}.`}</Text>
            ) : (
              <View
                style={
                  level === 0
                    ? styles.listItemBulletLevel0
                    : level === 1
                    ? styles.listItemBulletLevel1
                    : styles.listItemBulletLevel2
                }
              />
            )}
          </View>
          <View key={i}>
            {t.tokens.map((t, i) =>
              t.type === "list" ? (
                <MdList key={i} token={t} level={level + 1} />
              ) : t.type === "text" ? (
                <Text key={i}>
                  <MdInlineContent key={i} tokens={(t as any).tokens} />
                </Text>
              ) : t.type === "space" ? (
                <Text>{t.raw}</Text>
              ) : process.env.NODE_ENV === "production" ? null : (
                <Text>{JSON.stringify(t)}</Text>
              )
            )}
          </View>
        </View>
      ))}
    </View>
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
    return <Text>{"\n".repeat((token.raw.match(/\n/g)?.length ?? 1) - 1)}</Text>;
  }
  const content =
    "tokens" in token && token.tokens !== undefined ? (
      token.tokens.map((t, i) => <MdInline key={i} token={t as any} />)
    ) : (
      <Text>
        {unescape(token.text)
          .replaceAll(/\t/g, " ".repeat(4))
          .replaceAll(/^ +/gm, (match) => {
            // replace leading spaces with &nbsp; to preserve whitespace
            return match.replace(" ", "\xa0");
          })}
      </Text>
    );
  return token.type === "strong" ? (
    <Text style={{ fontWeight: 600 }}>{content}</Text>
  ) : token.type === "em" ? (
    <Text style={{ fontStyle: "italic" }}>{content}</Text>
  ) : token.type === "del" ? (
    <Text style={{ textDecoration: "line-through" }}>{content}</Text>
  ) : token.type === "link" ? (
    <Link style={{ color: "#5650de" }} src={token.href}>
      <Text>{content}</Text>
    </Link>
  ) : token.type === "text" ? (
    <Text>{content}</Text>
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
