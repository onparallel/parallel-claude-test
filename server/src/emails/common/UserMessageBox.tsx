import { MjmlColumn, MjmlText, MjmlWrapper, MjmlWrapperProps } from "mjml-react";

interface UserMessageBoxProps extends MjmlWrapperProps {
  bodyHtml?: string | null;
}
export function UserMessageBox({ bodyHtml, ...props }: UserMessageBoxProps) {
  return bodyHtml ? (
    <MjmlWrapper backgroundColor="#F4F7F9" borderRadius="5px" padding="12px 16px" {...props}>
      <MjmlColumn>
        <MjmlText lineHeight="21px" padding="0">
          <div dangerouslySetInnerHTML={{ __html: bodyHtml }}></div>
        </MjmlText>
      </MjmlColumn>
    </MjmlWrapper>
  ) : null;
}
