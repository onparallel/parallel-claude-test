import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Email } from "../buildEmail";
import { Closing } from "../common/Closing";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greetingFormal } from "../common/texts";

export type ContactAuthenticationRequest = {
  fullName: string | null;
  browserName: string;
  osName: string;
  code: string;
} & LayoutProps;

const email: Email<ContactAuthenticationRequest> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({}, intl) {
    return intl.formatMessage({
      id: "verification-code-request.subject",
      defaultMessage: "Verify your device",
    });
  },
  text({ fullName, code, browserName, osName }, intl) {
    return outdent`
      ${greetingFormal({ fullName }, intl)}
      ${intl.formatMessage({
        id: "verification-code-request.instructions",
        defaultMessage:
          "Please use the following verification code on the unrecognized device.",
      })}

      ${intl.formatMessage({
        id: "verification-code-request.device-label",
        defaultMessage: "Device:",
      })} ${intl.formatMessage(
      {
        id: "verification-code-request.device",
        defaultMessage: "{browserName} on {osName}",
      },
      { browserName, osName }
    )}
      ${intl.formatMessage({
        id: "verification-code-request.code-label",
        defaultMessage: "Verification code:",
      })} ${code}

      ${intl.formatMessage({
        id: "verification-code-request.expiry",
        defaultMessage:
          "This verification code will expire in 10 minutes, so make sure you use as soon as possible.",
      })}
      
      ${closing({}, intl)}
    `;
  },
  html({
    fullName,
    browserName,
    osName,
    code,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: ContactAuthenticationRequest) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection>
          <MjmlColumn>
            <GreetingFormal fullName={fullName} />
            <MjmlText>
              <FormattedMessage
                id="verification-code-request.instructions"
                defaultMessage="Please use the following verification code on the unrecognized device."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection padding="0">
          <MjmlColumn
            width="110px"
            borderRadius="3px"
            padding="10px"
            backgroundColor="#f0f0f0"
          >
            <MjmlText
              fontFamily="monospace"
              fontSize="24px"
              align="center"
              padding="0"
            >
              {code}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection padding="10px 0 0">
          <MjmlColumn>
            <MjmlText align="center" fontSize="12px" padding="0">
              <FormattedMessage
                id="verification-code-request.device"
                defaultMessage="{browserName} on {osName}"
                values={{ browserName, osName }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection>
          <MjmlColumn>
            <MjmlText>
              <FormattedMessage
                id="verification-code-request.expiry"
                defaultMessage="This verification code will expire in 10 minutes, so make sure you use as soon as possible."
              />
            </MjmlText>
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

export const props: ContactAuthenticationRequest = {
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
  fullName: "Santi Albo",
  code: "123456",
  browserName: "Safari",
  osName: "iOS",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
