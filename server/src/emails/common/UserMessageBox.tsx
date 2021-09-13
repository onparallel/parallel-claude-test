import { MjmlColumn, MjmlText, MjmlWrapper } from "mjml-react";
import { ReactNode } from "react";

interface UserMessageBoxProps {
  children?: ReactNode;
  dangerouslySetInnerHTML?: string | null;
}
export function UserMessageBox({ children, dangerouslySetInnerHTML }: UserMessageBoxProps) {
  return (
    <MjmlWrapper backgroundColor="#F4F7F9" borderRadius="5px" padding="12px 16px">
      <MjmlColumn>
        <MjmlText lineHeight="21px" padding="0">
          {children ? (
            children
          ) : dangerouslySetInnerHTML ? (
            <div dangerouslySetInnerHTML={{ __html: dangerouslySetInnerHTML }} />
          ) : null}
        </MjmlText>
      </MjmlColumn>
    </MjmlWrapper>
  );
}
