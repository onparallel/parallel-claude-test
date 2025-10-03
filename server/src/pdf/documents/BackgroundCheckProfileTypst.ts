import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { isNonNullish, isNullish, unique } from "remeda";
import {
  EntityDetailsResponse,
  EntitySearchRequest,
  EntitySearchResponse,
} from "../../services/BackgroundCheckService";
import { FORMATS } from "../../util/dates";
import { hashString } from "../../util/token";
import { formatPartialDate } from "../utils/formatPartialDate";
import { getCountryName } from "../utils/getCountryName";
import { PdfDocument } from "../utils/pdf";

export interface BackgroundCheckProfileProps {
  assetsUrl: string;
  entity: EntityDetailsResponse;
  query?: EntitySearchRequest;
  search?: EntitySearchResponse;
}

// Simplified version to avoid React context issues

function formatListOfTexts(values?: string[]): string {
  return values?.join(" · ") ?? " - ";
}

function formatDate(date: string, intl: IntlShape): string {
  try {
    return formatPartialDate({ date, intl });
  } catch {
    return date;
  }
}

function BackgroundCheckProfileTypst(props: BackgroundCheckProfileProps, intl: IntlShape) {
  const isPerson = props.entity.type === "Person";
  const isCompany = props.entity.type === "Company";
  const notSet = `text(fill: rgb("#A0AEC0"), style: "italic")[Any]`;

  // Generate search summary section
  const searchSummarySection = props.search
    ? outdent`
    // Search Summary
    #stack(
      spacing: 6pt,
      text(size: 10.5pt, weight: 600)[Search Summary],
      line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    )
    
    #item("Searching for", "${props.query?.type === "PERSON" ? "Person" : props.query?.type === "COMPANY" ? "Entity" : "person / entity"}")
    #item("Name", ${isNullish(props.query?.name) ? notSet : `"${props.query.name}"`})
    #item("Birthdate", ${isNullish(props.query?.date) ? notSet : `"${props.query.date}"`})
    ${
      props.query?.type === "PERSON"
        ? outdent`
    #item("Nationality", ${isNullish(props.query?.country) ? notSet : `"${getCountryName(props.query.country, intl.locale)}"`})
    #item("Country of birth", ${isNullish(props.query?.birthCountry) ? notSet : `"${getCountryName(props.query.birthCountry, intl.locale)}"`})`
        : outdent`
    #item("Country", ${isNullish(props.query?.country) ? notSet : `"${getCountryName(props.query.country, intl.locale)}"`})`
    }
    #item("Saved on", "${intl.formatDate(new Date((props.entity as any)?.createdAt), FORMATS.FULL)}")
  
    #v(6pt)
  `
    : "";

  // Generate entity-specific fields
  const entityFields =
    isCompany || isPerson
      ? outdent`
      #item("Type", "${props.entity.type}")
      ${
        isPerson
          ? outdent`
      #item("Gender", [#capitalize("${formatListOfTexts((props.entity.properties as any)?.gender)}")])
      #item("Nationality", "${(props.entity.properties as any)?.nationality?.map((n: string) => getCountryName(n, intl.locale)).join(" · ") ?? " - "}")
      #item("Country", "${(props.entity.properties as any)?.country?.map((c: string) => getCountryName(c, intl.locale)).join(" · ") ?? " - "}")
      #item("Country of birth", "${(props.entity.properties as any)?.countryOfBirth?.map((c: string) => getCountryName(c, intl.locale)).join(" · ") ?? " - "}")
      #item("Date of birth", "${(props.entity.properties as any)?.dateOfBirth?.map((date: string) => formatDate(date, intl)).join(" · ") ?? " - "}")`
          : outdent`
      #item("Jurisdiction", "${(props.entity.properties as any)?.jurisdiction?.map((n: string) => getCountryName(n, intl.locale)).join(" · ") ?? " - "}")
      #item("Date of registration", "${(props.entity.properties as any)?.dateOfRegistration?.map((date: string) => formatDate(date, intl)).join(" · ") ?? " - "}")`
      }
  `
      : "";

  const propertiesSources =
    props.entity.properties?.sourceUrl
      ?.map((url, index) => `#link("${url}")[#text(fill: rgb(77, 71, 198))[[${index + 1}]]]`)
      .join("") ?? "-";

  // Generate overview fields
  const overviewFields = outdent`
    #grid(
      columns: (15%, 85%),
      column-gutter: 4pt,
      row-gutter: 12pt,
      [#text(size: 8.25pt, weight: 600)[Other Name:]], [#text(size: 9pt)[${formatListOfTexts(props.entity.properties?.name)}]],
      [#text(size: 8.25pt, weight: 600)[Alias:]], [#text(size: 9pt)[${formatListOfTexts(props.entity.properties?.alias)}]],
      ${
        isPerson
          ? outdent`
      [#text(size: 8.25pt, weight: 600)[Place of birth:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.birthPlace)}]],
      [#text(size: 8.25pt, weight: 600)[Position:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.position)}]],
      [#text(size: 8.25pt, weight: 600)[Education:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.education)}]],
      [#text(size: 8.25pt, weight: 600)[Status:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.status)}]],
      [#text(size: 8.25pt, weight: 600)[Religion:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.religion)}]],
      [#text(size: 8.25pt, weight: 600)[Ethnicity:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.ethnicity)}]],
      [#text(size: 8.25pt, weight: 600)[Sources:]], [#text(size: 9pt)[${propertiesSources}]],
      `
          : outdent`
      [#text(size: 8.25pt, weight: 600)[Address:]], [#text(size: 9pt)[${formatListOfTexts((props.entity.properties as any)?.address)}]],
      [#text(size: 8.25pt, weight: 600)[Sources:]], [#text(size: 9pt)[${propertiesSources}]],
      `
      }
    )
  `;

  // Generate sanctions table
  const sanctionsTable = props.entity.properties.sanctions?.length
    ? outdent`
    #table(
      columns: (30%, 30%, 10%, 15%, 15%),
      [List Name / Authority], [Program], [Sources], [From], [To],
      ${props.entity.properties.sanctions
        ?.map((sanction) => {
          const authority = sanction.properties?.authority?.join(" · ") ?? "-";
          const datasets = sanction.datasets?.map((d) => d.title).join(" · ") || null;
          const combinedAuthority = [datasets, authority].filter(Boolean).join(" / ");
          const program = formatListOfTexts(sanction.properties?.program);
          const sources =
            sanction.properties?.sourceUrl
              ?.map(
                (url, index) => `#link("${url}")[#text(fill: rgb(77, 71, 198))[[${index + 1}]]]`,
              )
              .join("") ?? "-";
          const startDate =
            sanction.properties?.startDate?.map((date) => formatDate(date, intl)).join(" · ") ??
            "-";
          const endDate =
            sanction.properties?.endDate?.map((date) => formatDate(date, intl)).join(" · ") ?? "-";

          return outdent`[${combinedAuthority}], [${program}], [${sources}], [${startDate}], [${endDate}],`;
        })
        .join("")}
    )
  `
    : outdent`
    #v(0pt)
    #line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    #v(2pt)
    #text(size: 9pt)[We have not found this entity on any sanctions list.]
  `;

  // Generate relationships table
  const relationshipsTable = props.entity.properties?.relationships?.length
    ? outdent`
    #table(
      columns: (30%, 15%, 25%, 15%, 15%),
      [Name], [Type], [Relation], [From], [To],
      ${props.entity.properties.relationships
        ?.map((relationship) => {
          const name =
            relationship.properties?.entityA?.name === props.entity.name
              ? relationship.properties?.entityB?.name
              : relationship.properties?.entityA?.name;
          const type = relationship.type;
          const relationships = unique(
            relationship.properties?.relationship?.map((r) => r.replaceAll("-", " ")) ?? [],
          );
          const relation = formatListOfTexts(relationships);
          const startDate =
            relationship.properties?.startDate?.map((date) => formatDate(date, intl)).join(" · ") ??
            "-";
          const endDate =
            relationship.properties?.endDate?.map((date) => formatDate(date, intl)).join(" · ") ??
            "-";

          return `[${name}], [${type}], [${relation}], [${startDate}], [${endDate}],`;
        })
        .join("")}
    )
  `
    : `
    #v(0pt)
    #line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    #v(2pt)
    #text(size: 9pt)[We have not found any relevant relationship for this entity.]
  `;

  const datasetsTable = outdent`
    #table(
      columns: (30%, 70%),
      [Source], [Description],
      ${props.entity.datasets?.map((dataset) => {
        const sourceText =
          isNonNullish(dataset.url) && dataset.url !== "null"
            ? `#link("${dataset.url}")[#text(fill: rgb(77, 71, 198))[#underline[${dataset.title}]]]`
            : dataset.title;
        return outdent`[${sourceText}], [${dataset.summary}]`;
      })}
    )
  `;

  return outdent`
    #import "@preview/prequery:0.1.0"
    #let capitalize(text) = if text.len() > 0 { upper(text.slice(0, 1)) + lower(text.slice(1)) } else { text }
    
    #let item(label, content) = box(
      inset: (x: 0pt, y: 2pt),
      stroke: none,
      [
        #text(size: 8.25pt, weight: 600)[#label:] #text(size: 9pt)[#content] #h(12pt)
      ]
    )
    
    #let risk-label(risk) = {
      let bg-color = if risk == "role.pep" {
        rgb("#C6F6D5")
      } else if risk == "role.rca" {
        rgb("#CEEDFF") 
      } else if risk.starts-with("san") {
        rgb("#FED7D7")
      } else if risk.starts-with("ool") {
        rgb("#FEEBC8")
      } else if risk.starts-with("poi") {
        rgb("#FEFCBF")
      } else {
        rgb("#EDF2F7")
      }
      
      let text-color = if risk == "role.pep" {
        rgb("#22543D")
      } else if risk == "role.rca" {
        rgb("#153E75")
      } else if risk.starts-with("san") {
        rgb("#822727")
      } else if risk.starts-with("ool") {
        rgb("#7B341E")
      } else if risk.starts-with("poi") {
        rgb("#744210")
      } else {
        rgb("#2D3748")
      }
      
      let display-text = if risk.contains(".") {
        risk.split(".").at(1)
      } else {
        risk
      }
      
      box(
        fill: bg-color,
        inset: (x: 4pt, y: 3pt),
        radius: 2pt,
        text(
          size: 7.5pt,
          weight: 500,
          fill: text-color
        )[#upper(display-text)]
      )
    }
    #set page(
      margin: (
        top: 0.75in,
        right: 0.75in,
        bottom: 0.75in,
        left: 0.75in,
      ),
    )
    #set text(
      font: ("Noto Sans", "Noto Emoji"),
      size: 12pt,
      fill: rgb("#1A202C"),
    )
    #set par(leading: 0.98em, justify: false)

    #set table(
      stroke: (x: none, y: rgb("#E2E8F0")),
      inset: (x, y) => (
        left: if x == 0 { 0pt } else { 16pt },
        y: if y == 0 { 10pt } else { 8pt }
      ),
    )
    #show table.cell: it => {
      if (it.y == 0) {
        text(size: 7.5pt, weight: 600, upper(it))
      } else {
        text(size: 9pt, it)
      }
    }
    
    // Header
    #stack(
      dir: ltr,
      spacing: 8pt,
      [
        #context {
          let url = ${JSON.stringify(`${props.assetsUrl}/static/emails/logo.png`)}
          let path = ${JSON.stringify(`assets/${hashString(`${props.assetsUrl}/static/emails/logo.png`)}`)}
          prequery.image(url, path, width: 32mm)
        }
      ],
      [#align(horizon)[#line(angle: 90deg, length: 15pt, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))]],
      [#align(horizon)[#text(size: 10.5pt, fill: rgb("#4A5568"))[Background check]]]
    )
    
    #v(20pt)
    
    ${searchSummarySection}
    
    ${
      isCompany || isPerson
        ? `
    // Entity Name and Topics
    #stack(
      spacing: 6pt,
      stack(
      dir: ltr,
        spacing: 4pt,
        text(size: 10.5pt, weight: 600)[${props.entity.name}],
        h(4pt),
        ${props.entity.properties.topics?.map((topic) => `box[#v(-2pt)#risk-label("${topic}")]`).join(",") ?? ""}
      ),
      line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    )
    
    // Basic Information
    ${entityFields}
    
    #v(12pt)
    
    // Overview Section
    #stack(
      spacing: 6pt,
      text(size: 10.5pt, weight: 600)[Overview],
      line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    )
    
    ${overviewFields}
    
    #v(12pt)
    
    // Sanctions Lists
    #text(size: 10.5pt, weight: 600)[Sanctions Lists (${props.entity.properties.sanctions?.length ?? 0})]
    #v(-6pt)
    ${sanctionsTable}
    
    #v(12pt)
    
    // Relationships
    #text(size: 10.5pt, weight: 600)[Relationships (${props.entity.properties.relationships?.length ?? 0})]
    #v(-6pt)
    ${relationshipsTable}
    `
        : ""
    }

    ${
      isNonNullish(props.entity.datasets)
        ? outdent`
    #v(12pt)  
    
    // Data sources
    #text(size: 10.5pt, weight: 600)[Data sources (${props.entity.datasets?.length ?? 0})]
    #v(-6pt)
    ${datasetsTable}
    `
        : ""
    }
  `;
}

BackgroundCheckProfileTypst.TYPST = true;

export default BackgroundCheckProfileTypst as PdfDocument<{}, BackgroundCheckProfileProps>;
