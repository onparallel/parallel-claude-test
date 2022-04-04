import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";

export type DeveloperWebhookFailedEmailProps = {
  userName: string | null;
  errorMessage: string;
  postBody: any;
} & LayoutProps;

const email: Email<DeveloperWebhookFailedEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "developer.webhook-error-email.subject",
      defaultMessage: "Error: Event hook",
    });
  },
  text({ userName, errorMessage, postBody }: DeveloperWebhookFailedEmailProps, intl: IntlShape) {
    return outdent`
    ${greetingUser({ name: userName }, intl)}

    ${intl.formatMessage({
      id: "developer.webhook-error-email.text",
      defaultMessage: "We found an error regarding your event subscription.",
    })}

    ${errorMessage}
    
    ${JSON.stringify(postBody, null, 2)}

    ${intl.formatMessage({
      id: "developer.webhook-error-email.tip",
      defaultMessage:
        "Please, make sure your subscription configuration is correct and the URL is valid and accepts requests.",
    })}
      
    ${closing({}, intl)}
    `;
  },
  html({
    userName,
    errorMessage,
    postBody,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: DeveloperWebhookFailedEmailProps) {
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              <FormattedMessage
                id="developer.webhook-error-email.text"
                defaultMessage="We found an error regarding your event subscription."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection padding="0 20px">
          <MjmlColumn backgroundColor="#F4F7F9" borderRadius="5px" padding="10px 0">
            <MjmlText fontWeight={600}>{errorMessage}</MjmlText>
            <MjmlText>
              <pre>{JSON.stringify(postBody, null, 2)}</pre>
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection paddingTop="10px">
          <MjmlColumn>
            <MjmlText>
              <FormattedMessage
                id="developer.webhook-error-email.tip"
                defaultMessage="Please, make sure your subscription configuration is correct and the URL is valid and accepts requests."
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
