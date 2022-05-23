import { MjmlColumn, MjmlSection, MjmlText, MjmlWrapper } from "mjml-react";
import { FormattedMessage } from "react-intl";
import { Maybe } from "../../util/types";
import { BreakLines } from "../../util/BreakLines";

type FieldComment = {
  id: number;
  content: string;
  author: {
    id: string;
    name: string;
  };
};

export type PetitionFieldAndComments = {
  id: number;
  title: Maybe<string>;
  position: number;
  comments: FieldComment[];
};

export type PetitionFieldAndCommentsProps = {
  fields: PetitionFieldAndComments[];
};

export function PetitionFieldAndComments({ fields }: PetitionFieldAndCommentsProps) {
  /** group together consecutive comments of the same author */
  function groupCommentsByAuthor(comments: FieldComment[]) {
    const groups: FieldComment[][] = [];
    let group: FieldComment[] = [];
    for (const comment of comments) {
      if (group.length === 0) {
        group.push(comment);
      } else {
        if (group[group.length - 1].author.id === comment.author.id) {
          group.push(comment);
        } else {
          groups.push(group);
          group = [comment];
        }
      }
    }
    groups.push(group);
    return groups;
  }

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
          {groupCommentsByAuthor(comments).map((commentGroup, i) => (
            <MjmlSection key={i} padding="8px 50px">
              <MjmlColumn>
                {commentGroup.map(({ id, content, author }, commentNumber) => (
                  <MjmlSection key={id} padding="1px 0">
                    <MjmlColumn backgroundColor="#F4F7F9" borderRadius="4px" padding="8px 16px">
                      {commentNumber === 0 && (
                        <MjmlText fontSize="12px" padding="0">
                          <b>{author.name}</b>
                        </MjmlText>
                      )}
                      <MjmlText padding="0" lineHeight="24px">
                        <BreakLines>{content}</BreakLines>
                      </MjmlText>
                    </MjmlColumn>
                  </MjmlSection>
                ))}
              </MjmlColumn>
            </MjmlSection>
          ))}
        </MjmlWrapper>
      ))}
    </>
  );
}
