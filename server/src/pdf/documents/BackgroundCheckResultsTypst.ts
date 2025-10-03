import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { isNullish } from "remeda";
import { EntitySearchRequest, EntitySearchResponse } from "../../services/BackgroundCheckService";
import { FORMATS } from "../../util/dates";
import { hashString } from "../../util/token";
import { formatPartialDate } from "../utils/formatPartialDate";
import { getCountryName } from "../utils/getCountryName";
import { PdfDocument } from "../utils/pdf";

export interface BackgroundCheckResultsProps {
  assetsUrl: string;
  query: EntitySearchRequest;
  search: EntitySearchResponse<true>;
}

function formatDate(date: string, intl: IntlShape): string {
  try {
    return formatPartialDate({ date, intl });
  } catch {
    return date;
  }
}

function getEntityTypeLabel(type: string | null): string {
  return type === "PERSON" ? "Person" : type === "COMPANY" ? "Entity" : "person / entity";
}

function BackgroundCheckResultsTypst(props: BackgroundCheckResultsProps, intl: IntlShape) {
  const isCompanySearch = props.query?.type === "COMPANY";
  const notSet = `text(fill: rgb("#A0AEC0"), style: "italic")[Any]`;

  // Generate search summary section
  const searchSummarySection = outdent`
    // Search Summary
    #stack(
      spacing: 6pt,
      text(size: 10.5pt, weight: 600)[Search Summary],
      line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    )
    
    #item("Searching for", "${getEntityTypeLabel(props.query?.type)}")
    #item("Name", ${isNullish(props.query?.name) ? notSet : `"${props.query.name}"`})
    #item("Birthdate", ${isNullish(props.query?.date) ? notSet : `"${props.query.date}"`})
    ${
      props.query?.type === "PERSON"
        ? outdent`
    #item("Nationality", ${isNullish(props.query?.country) ? notSet : `"${getCountryName(props.query.country.toLowerCase(), intl.locale)}"`})
    #item("Country of birth", ${isNullish(props.query?.birthCountry) ? notSet : `"${getCountryName(props.query.birthCountry.toLowerCase(), intl.locale)}"`})`
        : outdent`
    #item("Country", ${isNullish(props.query?.country) ? notSet : `"${getCountryName(props.query.country.toLowerCase(), intl.locale)}"`})`
    }
    #item("Results as of", "${intl.formatDate(props.search.createdAt, FORMATS.FULL)}")
    #item("Results found", "${props.search.totalCount}")
  
    #v(12pt)
  `;

  // Generate results table
  const resultsTable =
    props.search.items.length > 0
      ? outdent`
    #table(
      columns: (${isCompanySearch ? "20%, 20%, 20%, 20%, 8%, 12%" : "15%, 15%, 10%, 15%, 15%, 12%, 6%, 12%"}),
      ${
        isCompanySearch
          ? "[Name], [Country/Territory], [Risk Labels], [Incorporation Date], [Score], [Status],"
          : "[Name], [Country/Territory], [Gender], [Risk Labels], [Country of Birth], [Date of Birth], [Score], [Status],"
      }
      ${props.search.items
        .map((item) => {
          const name = item.name;

          // Determine status
          const status = item.isMatch
            ? `#status-badge("saved")`
            : item.isFalsePositive
              ? `#status-badge("false-positive")`
              : "-";

          if (item.type === "Person") {
            const countries =
              item.properties.country?.map((c) => getCountryName(c, intl.locale)).join(" · ") ??
              "-";
            const gender =
              item.properties.gender
                ?.map((g) => {
                  if (g === "male") return "Male";
                  if (g === "female") return "Female";
                  return g || "-";
                })
                .join(" · ") ?? "-";
            const riskLabels =
              item.properties.topics?.map((topic) => `#risk-label("${topic}")`).join(" ") ?? "-";
            const birthCountries =
              item.properties.countryOfBirth
                ?.map((c) => getCountryName(c, intl.locale))
                .join(" · ") ?? "-";
            const birthDates =
              item.properties.birthDate?.map((date) => formatDate(date, intl)).join(" · ") ?? "-";
            const score = item.score ? `${Math.round(item.score * 100)}%` : "-";

            return isCompanySearch
              ? `[${name}], [${countries}], [${riskLabels}], [-], [${score}], [${status}],`
              : `[${name}], [${countries}], [${gender}], [${riskLabels}], [${birthCountries}], [${birthDates}], [${score}], [${status}],`;
          } else if (item.type === "Company") {
            const jurisdictions =
              item.properties.jurisdiction
                ?.map((j) => getCountryName(j, intl.locale))
                .join(" · ") ?? "-";
            const riskLabels =
              item.properties.topics?.map((topic) => `#risk-label("${topic}")`).join(" ") ?? "-";

            const incorporationDates =
              item.properties.incorporationDate
                ?.map((date) => formatDate(date, intl))
                .join(" · ") ?? "-";
            const score = item.score ? `${Math.round(item.score * 100)}%` : "-";

            return isCompanySearch
              ? `[${name}], [${jurisdictions}], [${riskLabels}], [${incorporationDates}], [${score}], [${status}],`
              : `[${name}], [${jurisdictions}], [-], [${riskLabels}], [-], [${incorporationDates}], [${score}], [${status}],`;
          }
          return "";
        })
        .join("\n      ")}
    )
  `
      : outdent`
    #v(0pt)
    #line(length: 100%, stroke: (thickness: 0.32mm, paint: rgb("#E2E8F0")))
    #v(8pt)
    #align(center)[
      #text(size: 12pt, weight: 500)[No results found]
    ]
    #v(12pt)
  `;

  return outdent`
    #import "@preview/prequery:0.1.0"
    
    #let item(label, content) = box(
      inset: (x: 0pt, y: 2pt),
      stroke: none,
      [
        #text(size: 8.25pt, weight: 600)[#label:] #text(size: 9pt)[#content] #h(12pt)
      ]
    )
    
    #set page(
      margin: (
        top: 10mm,
        right: 10mm,
        bottom: 10mm,
        left: 10mm,
      ),
    )
    #set text(
      font: ("Noto Sans", "Noto Emoji"),
      size: 12pt,
      fill: rgb("#1A202C"),
    )
    #set par(leading: 0.98em, justify: false)

    #show table.cell: it => {
      if (it.y == 0) {
        text(size: 7.5pt, weight: 600, upper(it))
      } else {
        text(size: 8pt, it)
      }
    }

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
        inset: (x: 3.5pt, y: 3pt),
        radius: 2pt,
        text(
          size: 6.5pt,
          weight: 500,
          fill: text-color
        )[#upper(display-text)]
      )
    }
    
    #let status-badge(status) = {
      let config = if status == "saved" {
        (
          bg: rgb("#C6F6D5"),
          text: rgb("#22543D"),
          label: "MATCH"
        )
      } else if status == "false-positive" {
        (
          bg: rgb("#FED7D7"),
          text: rgb("#822727"),
          label: "FALSE POSITIVE"
        )
      } else {
        (
          bg: rgb("#EDF2F7"),
          text: rgb("#2D3748"),
          label: "-"
        )
      }
      
      box(
        fill: config.bg,
        inset: (x: 4pt, y: 3pt),
        radius: 2pt,
        text(
          size: 6.5pt,
          weight: 500,
          fill: config.text
        )[#config.label]
      )
    }
    

    #set table(
      stroke: (x: none, y: rgb("#E2E8F0")),
      inset: (x, y) => (
        left: if x == 0 { 0pt } else { 4pt },
        right: 2pt,
        y: if y == 0 { 10pt } else { 8pt }
      ),
    )
    #show table.cell: it => {
      if (it.y == 0) {
        text(size: 7.5pt, weight: 600, upper(it))
      } else {
        text(size: 8.5pt, it)
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
    
    // Results Table
    #text(size: 10.5pt, weight: 600)[Search Results]
    #v(-6pt)
    ${resultsTable}
  `;
}

BackgroundCheckResultsTypst.TYPST = true;

export default BackgroundCheckResultsTypst as PdfDocument<{}, BackgroundCheckResultsProps>;
