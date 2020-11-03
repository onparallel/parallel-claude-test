export function groupFieldsByPages<T>(fields: T[]): T[][] {
  const pages: T[][] = [];
  let page: T[] = [];
  for (const field of fields) {
    if (
      (field as any).type === "HEADING" &&
      (field as any).options!.hasPageBreak
    ) {
      if (page.length > 0) {
        pages.push(page);
        page = [];
      }
    }
    page.push(field);
  }
  pages.push(page);
  return pages;
}
