// https://github.com/jquery/jquery/blob/a684e6ba836f7c553968d7d026ed7941e1a612d8/src/selector/escapeSelector.js
const ESCAPE_REGEX = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;

export function escapeSelector(selector: string) {
  return selector.replace(ESCAPE_REGEX, (ch, asCodePoint) => {
    if (asCodePoint) {
      // U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
      if (ch === "\0") {
        return "\uFFFD";
      }

      // Control characters and (dependent upon position) numbers get escaped as code points
      return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
    }

    // Other potentially-special ASCII characters get backslash-escaped
    return "\\" + ch;
  });
}
