import Graphemer from "graphemer";

const AFFIXES = [
  "da",
  "das",
  "de la",
  "de las",
  "de los",
  "de",
  "degli",
  "del",
  "di",
  "dos",
  "du",
  "el",
  "i",
  "la",
  "le",
  "van den",
  "van der",
  "van het",
  "van",
  "von",
];

const AFFIXES_RE = new RegExp(`\\s+(${AFFIXES.join("|")})(?=\\s+[^\\s])`, "gi");

const splitter = new Graphemer();

interface GetInitialsOptions {
  removeAffixes?: boolean;
}

export function getInitials(fullName: string, { removeAffixes = true }: GetInitialsOptions = {}) {
  const cleaned = removeAffixes ? fullName.replace(AFFIXES_RE, "") : fullName;
  return cleaned
    .split(/\s+/)
    .slice(0, 3)
    .map((word) => splitter.iterateGraphemes(word).next().value)
    .join("");
}
