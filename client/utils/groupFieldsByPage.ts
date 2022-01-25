import { PublicPetitionField } from "@parallel/graphql/__types";
import { zip } from "remeda";

export function groupFieldsByPages<T extends Pick<PublicPetitionField, "type" | "options">>(
  fields: T[],
  visibility: boolean[]
): T[][] {
  const pages: T[][] = [];
  let page: T[] = [];
  for (const [field, isVisible] of zip(fields, visibility)) {
    if (field.type === "HEADING" && field.options!.hasPageBreak && isVisible) {
      if (page.length > 0) {
        pages.push(page);
        page = [];
      }
    }
    if (isVisible) {
      page.push(field);
    }
  }
  pages.push(page);
  return pages;
}
