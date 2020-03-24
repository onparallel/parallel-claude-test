import {
  Mjml,
  MjmlBody,
  MjmlButton,
  MjmlColumn,
  MjmlHead,
  MjmlImage,
  MjmlPreview,
  MjmlSection,
  MjmlTitle,
} from "mjml-react";
import { FormattedMessage } from "react-intl";
import React from "react";

export interface ForgotPasswordProps {
  name: string;
}

export default function ForgotPassword({ name }: ForgotPasswordProps) {
  return (
    <Mjml>
      <MjmlHead>
        <MjmlTitle>Last Minute Offer</MjmlTitle>
        <MjmlPreview>Last Minute Offer...</MjmlPreview>
      </MjmlHead>
      <MjmlBody width={500}>
        <MjmlSection fullWidth backgroundColor="#efefef">
          <MjmlColumn>
            <MjmlImage src="https://static.wixstatic.com/media/5cb24728abef45dabebe7edc1d97ddd2.jpg" />
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection>
          <MjmlColumn>
            <MjmlButton
              padding="20px"
              backgroundColor="#346DB7"
              href="https://www.wix.com/"
            >
              <FormattedMessage
                id="greeting"
                defaultMessage="Hello {name}"
                values={{ name }}
              ></FormattedMessage>
            </MjmlButton>
          </MjmlColumn>
        </MjmlSection>
      </MjmlBody>
    </Mjml>
  );
}

export const props: ForgotPasswordProps = {
  name: "Michelle",
};
