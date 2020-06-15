import React from "react";
import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export type PetitionField = {
  position: number;
  id: number;
  title: string | null;
};

export type PetitionFieldListProps = {
  fields: PetitionField[];
};

export function PetitionFieldList({ fields }: PetitionFieldListProps) {
  return (
    <MjmlText paddingTop={0} paddingLeft="50px" lineHeight="24px">
      <ol style={{ margin: 0, padding: 0 }}>
        {fields.map(({ position, id, title }) => (
          <li key={id} value={position + 1} style={{ margin: 0, padding: 0 }}>
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
