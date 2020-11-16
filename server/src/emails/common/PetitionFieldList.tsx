import React, { Fragment } from "react";
import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export type PetitionField = {
  position: number;
  id: number;
  title: string | null;
  type: string;
};

export type PetitionFieldListProps = {
  fields: PetitionField[];
};

type GroupedField = {
  heading?: PetitionField;
  children: PetitionField[];
};

function groupByHeading(
  groups: GroupedField[],
  field: PetitionField
): GroupedField[] {
  if (field.type === "HEADING") {
    groups.push({
      heading: field,
      children: [],
    });
  } else {
    if (!groups[groups.length - 1]) {
      groups.push({ children: [] });
    }
    groups[groups.length - 1].children.push(field);
  }
  return groups;
}

export function PetitionFieldList({ fields }: PetitionFieldListProps) {
  return (
    <MjmlText paddingTop={0} paddingLeft="50px" lineHeight="24px">
      {fields.reduce(groupByHeading, []).map(({ heading, children }, index) => (
        <Fragment key={index}>
          <h3 style={{ margin: 0, fontSize: "1em" }}>{heading?.title}</h3>
          <ul style={{ margin: 0 }}>
            {children.map(({ position, id, title }) => (
              <li
                key={`children_${id}`}
                value={position + 1}
                style={{ margin: 0, padding: 0 }}
              >
                {title ? (
                  <span>{title}</span>
                ) : (
                  <span style={{ fontStyle: "italic" }}>
                    <FormattedMessage
                      id="generic.untitled-field"
                      defaultMessage="Untitled field"
                    />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </MjmlText>
  );
}
