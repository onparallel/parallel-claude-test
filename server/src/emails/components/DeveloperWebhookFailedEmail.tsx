import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";

export type DeveloperWebhookFailedEmailProps = {
  userName: string | null;
  errorMessage: string;
  subscriptionId: string;
  postBody: any;
} & LayoutProps;

const email: Email<DeveloperWebhookFailedEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "developer.webhook-error-email.subject",
      defaultMessage: "Error: Event hook",
    });
  },
  text(
    { userName, subscriptionId, errorMessage, postBody }: DeveloperWebhookFailedEmailProps,
    intl: IntlShape
  ) {
    return outdent`
    ${greeting({ name: userName }, intl)}

    ${intl.formatMessage(
      {
        id: "developer.webhook-error-email.text",
        defaultMessage: "We found an error regarding your event subscription {subscriptionId}.",
      },
      {
        subscriptionId,
      }
    )}

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
    subscriptionId,
    errorMessage,
    postBody,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: DeveloperWebhookFailedEmailProps) {
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0 0 16px 0">
          <MjmlColumn>
            <Greeting name={userName} />
            <MjmlText>
              <FormattedMessage
                id="developer.webhook-error-email.text"
                defaultMessage="We found an error regarding your event subscription {subscriptionId}."
                values={{ subscriptionId }}
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
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
