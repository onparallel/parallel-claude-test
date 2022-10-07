import { MjmlColumn, MjmlSection, MjmlText } from "@faire/mjml-react";
import outdent from "outdent";
import { FormattedMessage } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingContact } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingContact } from "../components/texts";

export type ContactAuthenticationRequest = {
  name: string;
  fullName: string;
  browserName: string;
  osName: string;
  code: string;
  isContactVerification: boolean;
} & LayoutProps;

const email: Email<ContactAuthenticationRequest> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ code, theme }, intl) {
    return intl.formatMessage(
      {
        id: "verification-code-request.subject",
        defaultMessage: "{code} is your verification code on Parallel",
      },
      { code, tone: theme.preferredTone }
    );
  },
  text({ name, fullName, code, browserName, osName, isContactVerification, theme }, intl) {
    return outdent`
      ${greetingContact({ name, fullName, tone: theme.preferredTone }, intl)}
      ${
        isContactVerification
          ? intl.formatMessage(
              {
                id: "verification-code-request.instructions-contact",
                defaultMessage:
                  "Please use the following verification code to access the information:",
              },
              { tone: theme.preferredTone }
            )
          : intl.formatMessage(
              {
                id: "verification-code-request.instructions",
                defaultMessage:
                  "Please use the following verification code on the unrecognized device.",
              },
              { tone: theme.preferredTone }
            )
      }

      ${intl.formatMessage({
        id: "verification-code-request.code-label",
        defaultMessage: "Verification code:",
      })} ${code}
      ${
        isContactVerification
          ? ""
          : `${intl.formatMessage({
              id: "verification-code-request.device-label",
              defaultMessage: "Device:",
            })} ${intl.formatMessage(
              {
                id: "verification-code-request.device",
                defaultMessage: "{browserName} on {osName}",
              },
              { browserName, osName }
            )}`
      }
    
      ${intl.formatMessage(
        {
          id: "verification-code-request.expiry",
          defaultMessage:
            "This verification code will expire in 30 minutes, please make sure you use it as soon as possible.",
        },
        { tone: theme.preferredTone }
      )}
      
      ${closing({}, intl)}
    `;
  },
  html({
    name,
    fullName,
    browserName,
    osName,
    code,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    removeParallelBranding,
    isContactVerification,
    theme,
  }: ContactAuthenticationRequest) {
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        utmCampaign="recipients"
        removeParallelBranding={removeParallelBranding}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={name} fullName={fullName} tone={theme.preferredTone} />
            {isContactVerification ? (
              <MjmlText>
                <FormattedMessage
                  id="verification-code-request.instructions-contact"
                  defaultMessage="Please use the following verification code to access the information:"
                  values={{ tone: theme.preferredTone }}
                />
              </MjmlText>
            ) : (
              <MjmlText>
                <FormattedMessage
                  id="verification-code-request.instructions"
                  defaultMessage="Please use the following verification code on the unrecognized device."
                  values={{ tone: theme.preferredTone }}
                />
              </MjmlText>
            )}
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection paddingTop="10px">
          <MjmlColumn width="110px" borderRadius="3px" padding="10px" backgroundColor="#F4F7F9">
            <MjmlText fontFamily="monospace" fontSize="24px" align="center" padding="0">
              {code}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        {isContactVerification ? null : (
          <MjmlSection padding="0">
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
        )}
        <MjmlSection>
          <MjmlColumn>
            <MjmlText>
              <FormattedMessage
                id="verification-code-request.expiry"
                defaultMessage="This verification code will expire in 30 minutes, please make sure you use it as soon as possible."
                values={{ tone: theme.preferredTone }}
              />
            </MjmlText>
            <ClosingParallelTeam />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
