import { MjmlColumn, MjmlSection, MjmlText, MjmlWrapper } from "mjml-react";
import { FormattedMessage } from "react-intl";
import { BreakLines } from "./BreakLines";
import { Maybe } from "../../util/types";

export type PetitionFieldAndComments = {
  id: number;
  title: Maybe<string>;
  position: number;
  comments: {
    id: number;
    content: string;
  }[];
};

export type PetitionFieldAndCommentsProps = {
  fields: PetitionFieldAndComments[];
};

export function PetitionFieldAndComments({
  fields,
}: PetitionFieldAndCommentsProps) {
  return (
    <>
      {fields.map(({ position, id, title, comments }) => (
        <MjmlWrapper key={id} padding="0">
          <MjmlSection padding="8px 0 0">
            <MjmlColumn>
              <MjmlText padding="0 20px 0 50px" lineHeight="24px">
                <ul style={{ margin: 0, padding: 0 }}>
                  <li value={position + 1} style={{ margin: 0, padding: 0 }}>
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
                </ul>
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
          {comments.map(({ id, content }) => (
            <MjmlSection key={id} padding="8px 50px">
              <MjmlColumn
                backgroundColor="#f6f6f6"
                borderRadius="4px"
                padding="8px 16px"
              >
                <MjmlText padding="0" lineHeight="24px">
                  <BreakLines>{content}</BreakLines>
                </MjmlText>
              </MjmlColumn>
            </MjmlSection>
          ))}
        </MjmlWrapper>
      ))}
    </>
  );
}
