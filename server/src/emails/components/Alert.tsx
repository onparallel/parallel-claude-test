import {
  MjmlColumn,
  MjmlSection,
  MjmlSectionProps,
  MjmlText,
  MjmlTextProps,
} from "@faire/mjml-react";
import { ReactNode } from "react";

interface AlertProps extends MjmlSectionProps {
  children: ReactNode;
  textColor?: MjmlTextProps["color"];
}
export function Alert({ children, textColor, ...props }: AlertProps) {
  return (
    <MjmlSection backgroundColor="#3182CE" borderRadius="5px" padding="10px 0" {...props}>
      <MjmlColumn>
        <MjmlText
          align="center"
          color={textColor ?? "white"}
          fontWeight={600}
          textTransform="uppercase"
        >
          {children}
        </MjmlText>
      </MjmlColumn>
    </MjmlSection>
  );
}
