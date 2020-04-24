import React from "react";
import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export type PetitionFieldListProps = {
  fields: {
    id: number;
    title: string | null;
  }[];
};

export function PetitionFieldList({ fields }: PetitionFieldListProps) {
  return (
    <MjmlText paddingTop={0} paddingLeft="50px" lineHeight="24px">
      <ol style={{ margin: 0, padding: 0 }}>
        {fields.map(({ id, title }) => (
          <li key={id} style={{ margin: 0, padding: 0 }}>
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
      </ol>
    </MjmlText>
  );
}
