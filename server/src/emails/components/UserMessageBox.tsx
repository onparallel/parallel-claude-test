import { MjmlColumn, MjmlText, MjmlSection, MjmlWrapper } from "@faire/mjml-react";
import { ReactNode } from "react";

interface UserMessageBoxProps {
  children?: ReactNode;
  dangerouslySetInnerHTML?: string | null;
}
export function UserMessageBox({ children, dangerouslySetInnerHTML }: UserMessageBoxProps) {
  return children || dangerouslySetInnerHTML ? (
    <MjmlWrapper padding="10px 25px">
      <MjmlSection backgroundColor="#F4F7F9" borderRadius="5px" padding="12px 16px">
        <MjmlColumn>
          <MjmlText lineHeight="21px" padding="0">
            {children ? (
              children
            ) : (
              <div dangerouslySetInnerHTML={{ __html: dangerouslySetInnerHTML! }} />
            )}
          </MjmlText>
        </MjmlColumn>
      </MjmlSection>
    </MjmlWrapper>
  ) : null;
}
